import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types"; // Adicionado para validação
import Api from "../../api/client/Api";
import {
  User,
  MapPin,
  Lock,
  Save,
  Edit2,
  Camera,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { cepMask } from "../../utils/masks.js";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import Header from "../../components/layout/Header/Header";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import DefaultAvatar from "../../assets/Avatar.jpg";
import { useUser } from "../../context/UserContext.jsx";

// COMPONENTE INPUT FIELD
const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  disabled = false,
  className = "",
  showPasswordToggle = false,
}) => (
  <UniversalInput
    label={label}
    name={name}
    value={value}
    onChange={onChange}
    type={showPasswordToggle ? "password" : type}
    disabled={disabled}
    wrapperClassName={className}
    endIcon={disabled && !showPasswordToggle ? <Lock className="h-4 w-4 text-gray-400" /> : undefined}
  />
);

// Validação de Props do InputField
InputField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  showPasswordToggle: PropTypes.bool,
};

// COMPONENTE MESSAGE ALERT (Movido para fora do componente Perfil por boas práticas)
const MessageAlert = ({ message }) => {
  if (!message.text) return null;

  return (
    <div
      className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
        message.type === "error"
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-green-50 text-green-700 border border-green-200"
      }`}
    >
      {message.type === "error" ? (
        <AlertCircle size={20} />
      ) : (
        <CheckCircle size={20} />
      )}
      <span>{message.text}</span>
    </div>
  );
};

// Validação de Props do MessageAlert
MessageAlert.propTypes = {
  message: PropTypes.shape({
    type: PropTypes.string,
    text: PropTypes.string,
  }).isRequired,
};

export default function Perfil() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    cargo: "",
    email: "",
    telefone: "",
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
    rua: "",
    cep: "",
    bairro: "",
    cidade: "",
    numero: "",
    estado: "",
    pais: "",
    complemento: "",
  });

  const { user, updatePhoto, clearPhoto, updateUser } = useUser();
  const userPhoto = user.photo ?? DefaultAvatar;
  const fileInputRef = useRef(null);

  const getUserId = () => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      console.error("ID do usuário não encontrado no sessionStorage.");
      return null;
    }
    return userId;
  };

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      previewProfilePhoto(file);
    }
    event.target.value = null;
  };

  const previewProfilePhoto = (file) => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      setMessage({
        type: "error",
        text: "Erro: ID do usuário não encontrado.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "Pré-visualizando foto de perfil..." });

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Url = reader.result;
      updatePhoto(base64Url);
      setMessage({ type: "success", text: "Foto de perfil atualizada!" });
      setLoading(false);
    };

    reader.onerror = () => {
      setMessage({ type: "error", text: "Erro ao ler o arquivo de imagem." });
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    const userId = getUserId();
    if (!userId) {
      setMessage({
        type: "error",
        text: "Erro: ID do usuário não encontrado.",
      });
      return;
    }

    clearPhoto();
    setMessage({
      type: "success",
      text: "Foto de perfil removida com sucesso!",
    });
  };

  useEffect(() => {
    const userId = getUserId();

    if (!userId) {
      console.error("ID do usuário não encontrado no sessionStorage.");
      return;
    }

    setLoading(true);
    Api.get(`/usuarios/${userId}`)
      .then((response) => {
        const userData =
          response.data.usuario || response.data.data || response.data;
        const endereco = userData.endereco || {};

        if (!user.photo && userData.fotoUrl) {
          updatePhoto(userData.fotoUrl);
        }

        setFormData({
          nome: userData.nome || "",
          cpf: userData.cpf || "",
          email: userData.email || "",
          telefone: userData.telefone || "",
          cargo: "Gerente Administrativo",

          rua: endereco.rua || endereco.logradouro || "",
          cep: endereco.cep || "",
          bairro: endereco.bairro || "",
          cidade: endereco.cidade || "",
          numero: endereco.numero || "",
          estado: endereco.uf || endereco.estado || "",
          pais: endereco.pais || "Brasil",
          complemento: endereco.complemento || "",

          senhaAtual: "",
          novaSenha: "",
          confirmarSenha: "",
        });
      })
      .catch((error) => {
        console.error("ERRO AO CARREGAR PERFIL");
        console.error("Erro:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "cep") {
      const masked = cepMask(value);
      setFormData((prev) => ({ ...prev, cep: masked }));
      const digits = masked.replace(/\D/g, "");
      if (digits.length === 8) fetchCep(digits);
      else setCepError("");
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchCep = useCallback(async (digits) => {
    setCepLoading(true);
    setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
        pais: "Brasil",
      }));
    } catch {
      setCepError("Erro ao buscar CEP. Verifique sua conexão.");
    } finally {
      setCepLoading(false);
    }
  }, []);

  const validatePasswordChange = () => {
    if (!formData.senhaAtual) {
      setMessage({ type: "error", text: "Digite sua senha atual." });
      return false;
    }

    if (!formData.novaSenha) {
      setMessage({ type: "error", text: "Digite a nova senha." });
      return false;
    }

    if (formData.novaSenha.length < 6) {
      setMessage({
        type: "error",
        text: "A nova senha deve ter pelo menos 6 caracteres.",
      });
      return false;
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      setMessage({
        type: "error",
        text: "A nova senha e a confirmação não coincidem.",
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setMessage({
        type: "error",
        text: "Não é possível salvar: usuário não autenticado.",
      });
      return;
    }

    if (isChangingPassword && !validatePasswordChange()) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const enderecoRequest = {
      rua: formData.rua,
      cep: formData.cep,
      cidade: formData.cidade,
      bairro: formData.bairro,
      uf: formData.estado,
      numero: formData.numero,
      complemento: formData.complemento,
      pais: formData.pais,
    };

    const usuarioRequest = {
      nome: formData.nome,
      email: formData.email,
      cpf: formData.cpf,
      telefone: formData.telefone,
      senha: isChangingPassword ? formData.novaSenha : "",
      endereco: enderecoRequest,
    };

    Api.put(`/usuarios/${userId}`, usuarioRequest)
      .then(() => {
        // Removida a variável 'response' que não era usada
        updateUser({ name: formData.nome, email: formData.email });

        setMessage({
          type: "success",
          text: isChangingPassword
            ? "Perfil e senha atualizados com sucesso!"
            : "Perfil atualizado com sucesso!",
        });
        setIsEditing(false);
        setIsChangingPassword(false);

        return Api.get(`/usuarios/${userId}`);
      })
      .then((response) => {
        const userData =
          response.data.usuario || response.data.data || response.data;
        const endereco = userData.endereco || {};

        if (userData.fotoUrl) {
          updatePhoto(userData.fotoUrl);
        }

        setFormData({
          nome: userData.nome || "",
          cpf: userData.cpf || "",
          email: userData.email || "",
          telefone: userData.telefone || "",
          cargo: "Gerente Administrativo",
          rua: endereco.rua || "",
          cep: endereco.cep || "",
          bairro: endereco.bairro || "",
          cidade: endereco.cidade || "",
          numero: endereco.numero || "",
          estado: endereco.uf || endereco.estado || "",
          pais: endereco.pais || "Brasil",
          complemento: endereco.complemento || "",
        });
      })
      .catch((error) => {
        console.error("Erro ao salvar:", error);
        console.error("Detalhes:", error.response?.data);
        alert("Erro ao salvar as informações. Verifique o console.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
      setMessage({ type: "", text: "" });
      setCepError("");
    }
  };

  return (
    <div className="flex h-screen font-sans overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-hidden">
          <div className="h-full pt-15">
            <div className="bg-white h-full border-t border-gray-200">
              <div className="flex flex-col lg:flex-row h-full">
                <div className="lg:w-80 bg-[#003249] text-white p-4 lg:p-8 pt-8 lg:pt-16 flex flex-col border-r border-gray-700">
                  <h2 className="text-base lg:text-lg font-medium text-gray-300 mb-4 lg:mb-8 pb-2 lg:pb-4">
                    Informações do Perfil
                  </h2>

                  <div className="flex flex-col items-center mb-6 lg:mb-10">
                    <div className="relative group mb-3 lg:mb-4">
                      <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden shadow-lg">
                        <img
                          src={userPhoto}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={handlePhotoClick}
                        disabled={loading}
                        className="absolute bottom-0 right-0 bg-[#003d6b] border-2 border-white p-2 rounded-full hover:bg-blue-800 transition cursor-pointer"
                        title="Adicionar/Trocar foto"
                      >
                        <Camera size={16} />
                      </button>
                      {userPhoto !== DefaultAvatar && (
                        <button
                          onClick={handleRemovePhoto}
                          disabled={loading}
                          className="absolute top-0 left-0 bg-gray-600 border-2 border-white p-1.5 rounded-full hover:bg-gray-700 transition opacity-70 hover:opacity-100 cursor-pointer"
                          title="Remover foto"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col mb-4 lg:mb-10 py-2 lg:py-6">
                      <h3 className="text-lg lg:text-xl font-semibold mb-1">
                        {formData.nome}
                      </h3>
                      <p className="text-xs lg:text-sm text-gray-400">
                        {formData.cargo}
                      </p>
                    </div>
                  </div>

                  <nav className="space-y-2 lg:space-y-3">
                    <button
                      onClick={() => {
                        setActiveTab("personal");
                        setIsEditing(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 cursor-pointer rounded-lg transition-all text-sm lg:text-base ${
                        activeTab === "personal"
                          ? "bg-cyan-500/20 text-white border-l-4 border-cyan-400 shadow-lg"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <User size={18} />
                      <span className="font-medium">Dados Pessoais</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("address");
                        setIsEditing(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 cursor-pointer rounded-lg transition-all text-sm lg:text-base ${
                        activeTab === "address"
                          ? "bg-cyan-500/20 text-white border-l-4 border-cyan-400 shadow-lg"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <MapPin size={18} />
                      <span className="font-medium">Dados de Endereço</span>
                    </button>
                  </nav>
                </div>

                <div className="flex-1 p-8 lg:p-12 overflow-y-auto h-full">
                  <div className="w-full h-full">
                    <div className="mb-10">
                      <h1 className="text-3xl font-bold text-gray-800 mb-2 py-1">
                        {activeTab === "personal"
                          ? "Dados Pessoais"
                          : "Dados de Endereço"}
                      </h1>
                      <p className="text-gray-600">
                        {activeTab === "personal"
                          ? "Atualize suas informações de forma rápida e segura."
                          : "Mantenha seu endereço atualizado para correspondências."}
                      </p>
                    </div>

                    <MessageAlert message={message} />

                    {loading && (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007EA7]"></div>
                        <p className="text-gray-600 mt-2">Carregando...</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {activeTab === "personal" ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
                          <InputField
                            label="Nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="lg:col-span-2 text-start py-3"
                          />

                          <InputField
                            label="CPF"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleInputChange}
                            disabled={true}
                            className="text-start"
                          />

                          <InputField
                            label="Cargo"
                            name="cargo"
                            value={formData.cargo}
                            onChange={handleInputChange}
                            disabled={true}
                            className="text-start"
                          />

                          <InputField
                            label="E-mail"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="text-start"
                          />

                          <InputField
                            label="Telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="text-start"
                          />

                          <div className="lg:col-span-2 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-800">
                                Segurança da Conta
                              </h3>
                              {isEditing && !isChangingPassword && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsChangingPassword(true)}
                                >
                                  Alterar senha
                                </Button>
                              )}
                            </div>

                            {isChangingPassword && isEditing ? (
                              <div className="flex flex-col gap-1 space-y-2 bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <InputField
                                  label="Senha Atual"
                                  name="senhaAtual"
                                  value={formData.senhaAtual}
                                  onChange={handleInputChange}
                                  disabled={false}
                                  showPasswordToggle={true}
                                  className="text-start gap-2"
                                />

                                <InputField
                                  label="Nova Senha"
                                  name="novaSenha"
                                  value={formData.novaSenha}
                                  onChange={handleInputChange}
                                  disabled={false}
                                  showPasswordToggle={true}
                                  className="text-start gap-2"
                                />

                                <InputField
                                  label="Confirmar Nova Senha"
                                  name="confirmarSenha"
                                  value={formData.confirmarSenha}
                                  onChange={handleInputChange}
                                  disabled={false}
                                  showPasswordToggle={true}
                                  className="text-start gap-2"
                                />

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setIsChangingPassword(false);
                                    setFormData((prev) => ({
                                      ...prev,
                                      novaSenha: "",
                                      confirmarSenha: "",
                                    }));
                                  }}
                                >
                                  Cancelar alteração de senha
                                </Button>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">
                                  {isEditing
                                    ? "Clique em 'Alterar senha' para atualizar sua senha de acesso."
                                    : "Clique em 'Editar Informações' para alterar sua senha."}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-10 py-9">
                          <InputField
                            label="Rua (Logradouro)"
                            name="rua"
                            value={formData.rua}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="lg:col-span-4 text-start"
                          />

                          <div className="lg:col-span-2 text-start flex flex-col">
                            <UniversalInput
                              label="CEP"
                              name="cep"
                              value={formData.cep}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              maxLength={9}
                              placeholder="00000-000"
                              error={cepError || undefined}
                              endIcon={
                                !isEditing ? (
                                  <Lock className="h-4 w-4 text-gray-400" />
                                ) : cepLoading ? (
                                  <Loader2 className="h-4 w-4 text-[#003d6b] animate-spin" />
                                ) : cepError ? (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                ) : undefined
                              }
                            />
                          </div>

                          <InputField
                            label="Bairro"
                            name="bairro"
                            value={formData.bairro}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="lg:col-span-2 text-start"
                          />

                          <InputField
                            label="Cidade"
                            name="cidade"
                            value={formData.cidade}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="lg:col-span-2 text-start"
                          />

                          <InputField
                            label="Número"
                            name="numero"
                            value={formData.numero}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="lg:col-span-2 text-start"
                          />

                          <InputField
                            label="Estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="lg:col-span-2 text-start"
                          />

                          <InputField
                            label="Pais"
                            name="pais"
                            value={formData.pais}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="lg:col-span-2 text-start"
                          />

                          <InputField
                            label="Complemento"
                            name="complemento"
                            value={formData.complemento}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="lg:col-span-4 text-start"
                          />
                        </div>
                      )}
                      <div className="pt-4 flex justify-end">
                        <Button
                          variant="primary"
                          onClick={toggleEdit}
                          disabled={loading}
                          className={isEditing ? "bg-green-700 hover:bg-green-800" : ""}
                          endIcon={!loading ? (isEditing ? <Save size={20} /> : <Edit2 size={20} />) : undefined}
                        >
                          {loading
                            ? "Salvando..."
                            : isEditing
                              ? "Salvar Alterações"
                              : "Editar Informações"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}