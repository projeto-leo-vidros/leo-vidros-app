import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
} from "lucide-react";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";

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
  if (v.length > 5) {
    return v.replace(/^(\d{5})(\d)/, "$1-$2");
  }
  return v;
};

export default function RotasResponsivoCompacto() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const [headerHeight, setHeaderHeight] = useState(80);
  const headerRef = useRef(null);

  const addressFromState = location.state?.address;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const [googleLoaded, setGoogleLoaded] = useState(false);

  const [addresses, setAddresses] = useState(() => {
    const savedAddresses = sessionStorage.getItem("routeAddresses");
    if (savedAddresses) {
      return JSON.parse(savedAddresses);
    }
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

    const currentMarkers = addresses.map((a) => a.coords);

    if (currentMarkers.length >= 2) {
      calculateRoute(currentMarkers);
    } else {
      setDirectionsResponse(null);
      setTotalTime("0 min");
      setTotalDistance("0 km");
    }

    if (addresses.length > 0) {
      const lastAddr = addresses[addresses.length - 1];
      setFinalPoint(lastAddr.formatted.split(",")[0]);
    }
  }, [addresses, googleLoaded]);

  useEffect(() => {
    if (addressFromState && googleLoaded) {
      const addAddressFromAgendamento = async () => {
        const addressExists = addresses.some(
          (addr) =>
            addr.formatted &&
            addr.formatted
              .toLowerCase()
              .includes(addressFromState.toLowerCase()),
        );

        if (!addressExists) {
          const result = await geoCodeAddress(addressFromState);
          if (result) {
            const newAddress = {
              id: `agendamento-${Date.now()}`,
              cep: "",
              numero: "",
              formatted: result.formatted,
              coords: result.location,
              isFixed: false,
              fromAgendamento: true,
            };
            setAddresses((prev) => [...prev, newAddress]);
          }
        }
      };

      addAddressFromAgendamento();
    }
  }, [addressFromState, googleLoaded]);

  const calculateRoute = (currentMarkers) => {
    if (!window.google || !window.google.maps) return;

    const waypoints = currentMarkers.slice(1, -1).map((marker) => ({
      location: marker,
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentMarkers[0],
        destination: currentMarkers[currentMarkers.length - 1],
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(Date.now()),
          trafficModel: "bestguess",
        },
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirectionsResponse(result);

          let totalDistVal = 0;
          let totalDurVal = 0;

          const legs = result.routes[0].legs;

          legs.forEach((leg) => {
            totalDistVal += leg.distance.value;
            totalDurVal += leg.duration.value;
          });

          setTotalDistance((totalDistVal / 1000).toFixed(1) + " km");

          const hours = Math.floor(totalDurVal / 3600);
          const minutes = Math.floor((totalDurVal % 3600) / 60);
          let timeString =
            hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
          setTotalTime(timeString);
        }
      },
    );
  };

  const geoCodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`,
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        return {
          location: data.results[0].geometry.location,
          formatted: data.results[0].formatted_address,
        };
      }
      return null;
    } catch (err) {
      console.error("Erro ao geocodificar endereço:", err);
      return null;
    }
  };

  const geoCodeCepNumero = async (cep, numero) => {
    try {
      const query = `${cep},${numero}`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${MAPS_KEY}`,
      );
      const data = await response.json();
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
    const cleanCep = cep.replace(/\D/g, "");

    const cepExists = addresses.some((addr) => addr.cep === cleanCep);
    if (cepExists) {
      alert("Este CEP já foi adicionado!");
      return;
    }

    const result = await geoCodeCepNumero(cleanCep, numero);
    if (result) {
      const newAddress = {
        id: `id-${Date.now()}`,
        cep: cleanCep,
        numero,
        formatted: result.formatted,
        coords: result.location,
        isFixed: false,
      };
      setAddresses((prev) => [...prev, newAddress]);
      cepInputRef.current.value = "";
      numeroInputRef.current.value = "";
    }
  };

  const deleteAddress = (id) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const saveEdit = async (id, newCep, newNumero) => {
    const cleanCep = newCep.replace(/\D/g, "");
    const result = await geoCodeCepNumero(cleanCep, newNumero);
    if (result) {
      const index = addresses.findIndex((a) => a.id === id);
      const newAddresses = [...addresses];
      newAddresses[index] = {
        ...newAddresses[index],
        cep: cleanCep,
        numero: newNumero,
        formatted: result.formatted,
        coords: result.location,
      };
      setAddresses(newAddresses);
      setEditingId(null);
    }
  };

  const handleReorder = (newOrder) => {
    setAddresses([addresses[0], ...newOrder]);
  };

  const fixedItem = addresses[0];
  const draggableItems = addresses.slice(1);

  return (
    <LoadScript
      googleMapsApiKey={MAPS_KEY}
      onLoad={() => setGoogleLoaded(true)}
    >
      <div className="app-page flex min-h-screen bg-[#f8fafc] font-sans overflow-x-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="app-content flex-1 flex flex-col w-full relative">
          <Header
            ref={headerRef}
            toggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          <main
            className="flex-1 flex flex-col items-center w-full px-4 pb-4 gap-4"
            style={{ paddingTop: `${headerHeight + 10}px` }}
          >
            {/* Cabeçalho da página de rotas */}
            <div className="w-full max-w-[1500px] shrink-0 mb-8 relative flex items-center justify-center">
              <div className="absolute left-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  startIcon={<ArrowLeft size={18} />}
                >
                  Voltar
                </Button>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="hidden sm:inline">Rotas de Serviços</span>
                <span className="sm:hidden">Rotas</span>
              </h1>
            </div>

            {/* Formulário e métricas */}
            <div className="w-full max-w-[1500px] shrink-0 flex flex-col gap-3 mb-4">
              <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden flex flex-col lg:flex-row">
                {/* Formulário de entrada */}
                <div className="p-3 lg:w-[40%] bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col justify-center">
                  <h3 className="text-xs font-bold text-[#002B4E] uppercase mb-1 flex items-center gap-2">
                    <MapPin size={14} /> Adicionar a Rota
                  </h3>
                  <div className="flex gap-2 items-center py-1">
                    <UniversalInput
                      ref={cepInputRef}
                      onInput={(e) =>
                        (e.target.value = maskCep(e.target.value))
                      }
                      wrapperClassName="flex-1"
                      placeholder="CEP"
                    />
                    <UniversalInput
                      ref={numeroInputRef}
                      wrapperClassName="w-16 sm:w-24"
                      placeholder="Nº"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        addCep(
                          cepInputRef.current.value,
                          numeroInputRef.current.value,
                        )
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Métricas da rota */}
                <div className="flex-1 p-3 grid grid-cols-3 divide-x divide-gray-100 bg-white">
                  <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
                    <Clock size={18} className="text-[#002B4E] shrink-0" />
                    <span className="text-xs font-semibold text-gray-500 leading-tight">
                      Tempo<br className="hidden sm:block" /><span className="sm:hidden"> </span>Estimado
                    </span>
                    <span className="text-sm sm:text-base font-bold text-gray-800">
                      {totalTime}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
                    <Navigation size={18} className="text-[#002B4E] shrink-0" />
                    <span className="text-xs font-semibold text-gray-500 leading-tight">
                      Distância<br className="hidden sm:block" /><span className="sm:hidden"> </span>Total
                    </span>
                    <span className="text-sm sm:text-base font-bold text-gray-800">
                      {totalDistance}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
                    <Flag size={18} className="text-[#002B4E] shrink-0" />
                    <span className="text-xs font-semibold text-gray-500 leading-tight">
                      Destino<br className="hidden sm:block" /><span className="sm:hidden"> </span>Final
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 truncate w-full">
                      {finalPoint}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid com Mapa e Lista de Paradas */}
            <div className="w-full max-w-[1500px] flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Mapa da rota */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden flex flex-col h-full">
                <div className="bg-[#002B4E] text-white py-2 px-4 font-bold text-xs flex justify-between items-center shrink-0">
                  <span className="flex items-center gap-2">
                    <Navigation size={14} /> Mapa
                  </span>
                </div>
                <div className="grow relative bg-gray-100">
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
              <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden flex flex-col h-full">
                <div className="bg-[#002B4E] text-white py-2 px-4 font-bold text-md flex justify-between items-center z-10 shrink-0">
                  <span className="flex items-center gap-2">
                    <MapPin size={14} />
                    {addresses.length - 1} Pontos de Atendimento
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-3 scrollbar-thin">
                  {/* Ponto fixo */}
                  <div className="bg-white rounded border-l-4 border-[#002B4E] shadow-sm p-3 flex gap-3 items-center mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#002B4E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      <Store size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">
                        {fixedItem.formatted.split(",")[0]}
                      </p>
                    </div>
                  </div>

                  {/* Lista arrastável */}
                  <Reorder.Group
                    axis="y"
                    values={draggableItems}
                    onReorder={handleReorder}
                    className="space-y-2"
                  >
                    <AnimatePresence>
                      {draggableItems.map((addr, index) => {
                        const realIndex = index + 1;
                        return (
                          <Reorder.Item
                            key={addr.id}
                            value={addr}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileDrag={{
                              scale: 1.02,
                              boxShadow: "0px 5px 10px rgba(0,0,0,0.1)",
                            }}
                            className="bg-white rounded border border-gray-200 p-2 flex gap-2 items-center shadow-sm cursor-grab active:cursor-grabbing"
                          >
                            <div className="text-gray-300 cursor-grab">
                              <GripVertical size={14} />
                            </div>

                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${realIndex === addresses.length - 1 ? "bg-red-500" : "bg-blue-500"}`}
                            >
                              {realIndex + 1}
                            </div>

                            {editingId === addr.id ? (
                              <div className="flex-1 flex gap-1">
                                <UniversalInput
                                  id={`edit-cep-${addr.id}`}
                                  defaultValue={addr.cep}
                                  wrapperClassName="flex-1"
                                  className="border-blue-400 p-1 text-[12px]"
                                />
                                <UniversalInput
                                  id={`edit-num-${addr.id}`}
                                  defaultValue={addr.numero}
                                  wrapperClassName="w-10"
                                  className="border-blue-400 p-1 text-[12px]"
                                />
                                <button
                                  onClick={() =>
                                    saveEdit(
                                      addr.id,
                                      document.getElementById(
                                        `edit-cep-${addr.id}`,
                                      ).value,
                                      document.getElementById(
                                        `edit-num-${addr.id}`,
                                      ).value,
                                    )
                                  }
                                  className="bg-green-600 text-white px-1.5 rounded text-[12px] cursor-pointer"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm truncate">
                                  {addr.formatted.split(",")[0]}
                                </p>
                              </div>
                            )}

                            {editingId !== addr.id && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingId(addr.id)}
                                  className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => deleteAddress(addr.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </Reorder.Item>
                        );
                      })}
                    </AnimatePresence>
                  </Reorder.Group>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </LoadScript>
  );
}
