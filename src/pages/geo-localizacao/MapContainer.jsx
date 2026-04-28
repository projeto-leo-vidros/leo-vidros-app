import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  LoadScript,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Reorder, AnimatePresence } from "framer-motion";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import {
  ArrowLeft,
  MapPin,
  Trash2,
  Edit2,
  Clock,
  Navigation,
  Flag,
  GripVertical,
  Store,
  Plus,
} from "lucide-react";
import Swal from "sweetalert2";

const MAPS_KEY = import.meta.env.VITE_MAPS_KEY;

const mapContainerStyle = {
  height: "100%",
  width: "100%",
};

const defaultCenter = {
  lat: -23.64403375840359,
  lng: -46.783811794234204,
};

const maskCep = (value) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length > 5) return v.replace(/^(\d{5})(\d)/, "$1-$2");
  return v;
};

export default function RotasResponsivoCompacto() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const addressFromState = location.state?.address;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [googleLoaded, setGoogleLoaded] = useState(false);

  const [addresses, setAddresses] = useState(() => {
    const saved = sessionStorage.getItem("routeAddresses");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "init-0",
        cep: "",
        numero: "",
        formatted: "Ponto Inicial - Sede Léo Vidros",
        coords: defaultCenter,
        isFixed: true,
      },
    ];
  });

  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [totalTime, setTotalTime] = useState("0 min");
  const [totalDistance, setTotalDistance] = useState("0 km");
  const [finalPoint, setFinalPoint] = useState("N/A");
  const [editingId, setEditingId] = useState(null);

  const cepInputRef = useRef(null);
  const numeroInputRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem("routeAddresses", JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    if (!googleLoaded) return;
    const markers = addresses.map((a) => a.coords);
    if (markers.length >= 2) {
      calculateRoute(markers);
    } else {
      setDirectionsResponse(null);
      setTotalTime("0 min");
      setTotalDistance("0 km");
    }
    if (addresses.length > 0) {
      setFinalPoint(addresses[addresses.length - 1].formatted.split(",")[0]);
    }
  }, [addresses, googleLoaded]);

  useEffect(() => {
    if (!addressFromState || !googleLoaded) return;
    const addFromAgendamento = async () => {
      const exists = addresses.some(
        (a) =>
          a.formatted?.toLowerCase().includes(addressFromState.toLowerCase()),
      );
      if (!exists) {
        const result = await geoCodeAddress(addressFromState);
        if (result) {
          setAddresses((prev) => [
            ...prev,
            {
              id: `agendamento-${Date.now()}`,
              cep: "",
              numero: "",
              formatted: result.formatted,
              coords: result.location,
              isFixed: false,
              fromAgendamento: true,
            },
          ]);
        }
      }
    };
    addFromAgendamento();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressFromState, googleLoaded]);

  const calculateRoute = (markers) => {
    if (!window.google?.maps) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: markers[0],
        destination: markers[markers.length - 1],
        waypoints: markers.slice(1, -1).map((m) => ({ location: m, stopover: true })),
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: "bestguess",
        },
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirectionsResponse(result);
          let dist = 0;
          let dur = 0;
          result.routes[0].legs.forEach((leg) => {
            dist += leg.distance.value;
            dur += leg.duration.value;
          });
          setTotalDistance((dist / 1000).toFixed(1) + " km");
          const h = Math.floor(dur / 3600);
          const m = Math.floor((dur % 3600) / 60);
          setTotalTime(h > 0 ? `${h}h ${m}min` : `${m}min`);
        }
      },
    );
  };

  const geoCodeAddress = async (address) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`,
      );
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        return {
          location: data.results[0].geometry.location,
          formatted: data.results[0].formatted_address,
        };
      }
      return null;
    } catch (err) {
      console.error("Erro ao geocodificar:", err);
      return null;
    }
  };

  const geoCodeCepNumero = async (cep, numero) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${cep},${numero}`)}&key=${MAPS_KEY}`,
      );
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        return {
          location: data.results[0].geometry.location,
          formatted: data.results[0].formatted_address,
        };
      }
      return null;
    } catch (err) {
      console.error("Erro ao geocodificar:", err);
      return null;
    }
  };

  const addCep = async (cep, numero) => {
    if (!cep) return;
    const clean = cep.replace(/\D/g, "");
    if (addresses.some((a) => a.cep === clean)) {
      Swal.fire({ icon: "info", title: "CEP duplicado", text: "Este CEP já foi adicionado na lista.", confirmButtonColor: "#2563eb" });
      return;
    }
    const result = await geoCodeCepNumero(clean, numero);
    if (result) {
      setAddresses((prev) => [
        ...prev,
        {
          id: `id-${Date.now()}`,
          cep: clean,
          numero,
          formatted: result.formatted,
          coords: result.location,
          isFixed: false,
        },
      ]);
      cepInputRef.current.value = "";
      numeroInputRef.current.value = "";
    }
  };

  const deleteAddress = (id) =>
    setAddresses(addresses.filter((a) => a.id !== id));

  const saveEdit = async (id, newCep, newNumero) => {
    const clean = newCep.replace(/\D/g, "");
    const result = await geoCodeCepNumero(clean, newNumero);
    if (result) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, cep: clean, numero: newNumero, formatted: result.formatted, coords: result.location }
            : a,
        ),
      );
      setEditingId(null);
    }
  };

  const handleReorder = (newOrder) =>
    setAddresses([addresses[0], ...newOrder]);

  const fixedItem = addresses[0];
  const draggableItems = addresses.slice(1);

  return (
    <LoadScript googleMapsApiKey={MAPS_KEY} onLoad={() => setGoogleLoaded(true)}>
      <div className="app-page flex bg-[#f7f9fa] min-h-screen">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="app-content flex-1 flex flex-col min-h-screen">
          <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
          <div className="pt-20 lg:pt-20" />

          <main className="flex-1 flex flex-col items-center px-4 md:px-8 pt-6 pb-10">
            <div className="w-full max-w-[1380px] flex flex-col gap-2">

              {/* Botão Voltar */}
              <div className="flex items-center mb-6">
                <button
                  type="button"
                  onClick={() => navigate("/agendamentos")}
                  className="flex w-full items-center justify-center gap-2.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium cursor-pointer border border-gray-300 rounded-md px-4 py-2.5 sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para agendamentos
                </button>
              </div>

              {/* Título */}
              <div className="text-center mb-8 md:mb-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-1">
                  Rotas de Serviços
                </h1>
                <p className="text-gray-500 text-sm">Planeje e otimize os atendimentos</p>
              </div>

              {/* Formulário + KPIs lado a lado */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col justify-center gap-3 rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#003d6b]" />
                    <p className="text-sm font-semibold text-gray-800">Adicionar Parada</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={cepInputRef}
                      onInput={(e) => (e.target.value = maskCep(e.target.value))}
                      placeholder="CEP"
                      className="flex-1 px-3 py-2 border-2 border-[#005a7a] rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                    />
                    <input
                      ref={numeroInputRef}
                      placeholder="Nº"
                      className="w-16 px-3 py-2 border-2 border-[#005a7a] rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                    />
                  </div>
                  <button
                    onClick={() =>
                      addCep(cepInputRef.current.value, numeroInputRef.current.value)
                    }
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#002B4E] hover:bg-[#003d6b] text-white rounded-md transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                {/* KPI: Tempo */}
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-5 text-center shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="mb-4 flex w-full items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-[#003d6b]" />
                    <p className="text-sm font-semibold text-gray-800">Tempo Estimado</p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">{totalTime}</h2>
                    <p className="text-sm text-gray-500">Tempo de viagem</p>
                  </div>
                </div>

                {/* KPI: Distância */}
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-5 text-center shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="mb-4 flex w-full items-center justify-center gap-2">
                    <Navigation className="h-5 w-5 text-[#003d6b]" />
                    <p className="text-sm font-semibold text-gray-800">Distância Total</p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">{totalDistance}</h2>
                    <p className="text-sm text-gray-500">Km percorridos</p>
                  </div>
                </div>

                {/* KPI: Destino Final */}
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-5 text-center shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="mb-4 flex w-full items-center justify-center gap-2">
                    <Flag className="h-5 w-5 text-[#003d6b]" />
                    <p className="text-sm font-semibold text-gray-800">Destino Final</p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 truncate w-full" title={finalPoint}>
                      {finalPoint}
                    </h2>
                    <p className="text-sm text-gray-500">Última parada</p>
                  </div>
                </div>
              </div>

              <br />

              {/* Mapa + Lista de paradas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Mapa */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="bg-[#002B4E] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Navigation className="w-4 h-4" />
                      Mapa da Rota
                    </span>
                    {addresses.length >= 2 && (
                      <span className="text-xs font-medium text-green-300 bg-green-900/40 border border-green-700 px-2 py-0.5 rounded-full">
                        Rota calculada
                      </span>
                    )}
                  </div>
                  <div className="flex-1" style={{ minHeight: "460px" }}>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={
                        addresses.length > 0
                          ? addresses[Math.floor(addresses.length / 2)].coords
                          : defaultCenter
                      }
                      zoom={12}
                      options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                      }}
                    >
                      {addresses.map((addr, i) => (
                        <Marker
                          key={addr.id}
                          position={addr.coords}
                          label={{
                            text: `${i + 1}`,
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        />
                      ))}
                      {directionsResponse && (
                        <DirectionsRenderer
                          options={{
                            directions: directionsResponse,
                            suppressMarkers: true,
                          }}
                        />
                      )}
                    </GoogleMap>
                  </div>
                </div>

                {/* Lista de paradas */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                  <div className="bg-[#002B4E] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <MapPin className="w-4 h-4" />
                      Paradas
                    </span>
                    <span className="text-xs font-medium text-blue-200 bg-white/10 px-2 py-0.5 rounded-full">
                      {draggableItems.length} {draggableItems.length === 1 ? "ponto" : "pontos"}
                    </span>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f7f9fa]"
                    style={{ minHeight: "460px" }}
                  >
                    {/* Ponto fixo */}
                    <div className="bg-white rounded-md border border-gray-200 border-l-4 border-l-[#007EA7] p-3 flex gap-3 items-center shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-[#007EA7] flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#007EA7] uppercase tracking-wide mb-0.5">
                          Ponto de partida
                        </p>
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {fixedItem.formatted.split(",")[0]}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-white bg-[#007EA7] rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        1
                      </span>
                    </div>

                    {/* Linha conectora */}
                    {draggableItems.length > 0 && (
                      <div className="flex items-center gap-2 px-3">
                        <div className="w-px h-4 bg-gray-300 ml-3.5" />
                        <span className="text-xs text-gray-400">
                          Arraste para reordenar
                        </span>
                      </div>
                    )}

                    {/* Lista arrastável */}
                    <Reorder.Group
                      axis="y"
                      values={draggableItems}
                      onReorder={handleReorder}
                      className="space-y-2"
                    >
                      <AnimatePresence>
                        {draggableItems.map((addr, index) => {
                          const isLast = index === draggableItems.length - 1;
                          return (
                            <Reorder.Item
                              key={addr.id}
                              value={addr}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              whileDrag={{
                                scale: 1.02,
                                boxShadow: "0px 4px 12px rgba(0,0,0,0.12)",
                              }}
                              className={`bg-white rounded-md border border-gray-200 shadow-sm p-3 flex gap-2 items-center cursor-grab active:cursor-grabbing ${
                                isLast ? "border-l-4 border-l-red-500" : "border-l-4 border-l-blue-500"
                              }`}
                            >
                              <div className="text-gray-300 shrink-0">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${
                                  isLast ? "bg-red-500" : "bg-blue-500"
                                }`}
                              >
                                {index + 2}
                              </div>

                              {editingId === addr.id ? (
                                <div className="flex-1 flex gap-1">
                                  <input
                                    id={`edit-cep-${addr.id}`}
                                    defaultValue={addr.cep}
                                    className="flex-1 px-2 py-1 border-2 border-[#005a7a] rounded-md text-xs focus:ring-2 focus:ring-[#007EA7]"
                                  />
                                  <input
                                    id={`edit-num-${addr.id}`}
                                    defaultValue={addr.numero}
                                    className="w-12 px-2 py-1 border-2 border-[#005a7a] rounded-md text-xs focus:ring-2 focus:ring-[#007EA7]"
                                  />
                                  <button
                                    onClick={() =>
                                      saveEdit(
                                        addr.id,
                                        document.getElementById(`edit-cep-${addr.id}`).value,
                                        document.getElementById(`edit-num-${addr.id}`).value,
                                      )
                                    }
                                    className="bg-[#007EA7] hover:bg-[#006891] text-white px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : (
                                <div className="flex-1 min-w-0">
                                  {isLast && (
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide leading-none mb-0.5">
                                      Destino final
                                    </p>
                                  )}
                                  <p className="text-sm font-semibold text-gray-800 truncate">
                                    {addr.formatted.split(",")[0]}
                                  </p>
                                  {addr.fromAgendamento && (
                                    <p className="text-[10px] text-[#007EA7] font-medium">
                                      via agendamento
                                    </p>
                                  )}
                                </div>
                              )}

                              {editingId !== addr.id && (
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => setEditingId(addr.id)}
                                    className="p-1.5 text-gray-400 hover:text-[#007EA7] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteAddress(addr.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </Reorder.Item>
                          );
                        })}
                      </AnimatePresence>
                    </Reorder.Group>

                    {draggableItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                        <div className="bg-gray-100 p-4 rounded-full">
                          <MapPin className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mt-2">
                          Nenhuma parada adicionada
                        </p>
                        <p className="text-xs text-gray-400">
                          Use o formulário acima para adicionar destinos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </LoadScript>
  );
}
