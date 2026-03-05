import React from "react";
import { useState, useEffect } from "react";
import { Package, ChevronDown, Plus, X, AlertCircle } from "lucide-react";
import Api from "../../../../api/client/Api";
import Button from "../../../../components/ui/Button/Button.component";

const useProductAPI = () => {
  const salvarProduto = async (produtoData) => {
    try {
      const response = await Api.post(`/produtos`, {
        nome: produtoData.nome,
        descricao: produtoData.descricao,
        unidademedida: produtoData.unidadeMedida,
        preco: parseFloat(produtoData.preco),
        ativo: produtoData.ativo,
        metrica: {
          nivelMinimo: parseInt(produtoData.nivelMinimo) || 0,
          nivelMaximo: parseInt(produtoData.nivelMaximo) || 0,
        },
        atributos: produtoData.atributos.filter(
          (attr) => attr.tipo && attr.valor,
        ),
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao salvar produto",
      );
    }
  };

  const registrarEntradaEstoque = async (produtoId, estoqueData) => {
    try {
      const response = await Api.post(`/estoques/entrada`, {
        produtoId: produtoId,
        localizacao: estoqueData.localizacao,
        quantidadeTotal: parseInt(estoqueData.qtdTotal) || 0,
        dataHora: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao registrar entrada no estoque",
      );
    }
  };

  return { salvarProduto, registrarEntradaEstoque };
};

const DEFAULT_FORM_DATA = {
  nome: "",
  descricao: "",
  unidadeMedida: "Unidade",
  preco: 0,
  ativo: true,
  atributos: [],
  nivelMinimo: 0,
  nivelMaximo: 0,
  qtdTotal: 0,
  localizacao: "",
};

const NovoProdutoModal = ({ isOpen, onClose, onSuccess, item = null }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEditing = item !== null;

  const { salvarProduto, registrarEntradaEstoque } = useProductAPI();

  const steps = [
    { id: 0, name: "Informações Básicas" },
    { id: 1, name: "Atributos" },
    { id: 2, name: "Métricas" },
    { id: 3, name: "Estoque" },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData(item ? { ...DEFAULT_FORM_DATA, ...item } : DEFAULT_FORM_DATA);
      setCurrentStep(0);
      setError(null);
    }
  }, [item, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const handleAddAtributo = () => {
    setFormData((prev) => ({
      ...prev,
      atributos: [...prev.atributos, { tipo: "", valor: "" }],
    }));
  };

  const handleRemoveAtributo = (index) => {
    setFormData((prev) => ({
      ...prev,
      atributos: prev.atributos.filter((_, i) => i !== index),
    }));
  };

  const handleAtributoChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      atributos: prev.atributos.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr,
      ),
    }));
  };

  const validateStep = () => {
    setError(null);

    if (currentStep === 0) {
      if (!formData.nome.trim()) {
        setError("Nome do produto é obrigatório");
        return false;
      }
      if (!formData.preco || formData.preco <= 0) {
        setError("Preço deve ser maior que zero");
        return false;
      }
    }

    if (currentStep === 2) {
      const min = parseInt(formData.nivelMinimo) || 0;
      const max = parseInt(formData.nivelMaximo) || 0;

      if (max > 0 && min > max) {
        setError("Nível mínimo não pode ser maior que o nível máximo");
        return false;
      }
    }

    if (currentStep === 3) {
      if (formData.qtdTotal > 0 && !formData.localizacao.trim()) {
        setError("Localização é obrigatória quando há quantidade em estoque");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Salvar o produto (etapas 0, 1, 2)
      const produtoSalvo = await salvarProduto(formData);

      // 2. Se há quantidade em estoque, registrar entrada (etapa 3)
      if (formData.qtdTotal > 0 && formData.localizacao.trim()) {
        await registrarEntradaEstoque(produtoSalvo.id, formData);
      }

      // Sucesso!
      if (onSuccess) {
        onSuccess(produtoSalvo);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 px-10 py-20 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-center px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <Package className="w-6 h-6 text-[#007EA7]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center">
              {isEditing ? "Editar Produto" : "Novo Produto"}
            </h2>
          </div>
        </div>

        {/* Stepper */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      index <= currentStep
                        ? "bg-[#007EA7] text-white shadow-md"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs mt-3 text-center ${
                      index <= currentStep
                        ? "text-gray-900 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mb-8 mx-3 rounded-full ${
                      index < currentStep ? "bg-[#007EA7]" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-8 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Erro</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="px-8 py-8 space-y-6 overflow-y-auto flex-1">
          {/* Etapa 0 - Informações Básicas */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                  Nome do produto *
                </label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Digite o nome do produto"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left"
                  value={formData.nome}
                  onChange={handleChange}
                />
              </div>
              <br />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                    Unidade de medida
                  </label>
                  <div className="relative">
                    <select
                      name="unidadeMedida"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left appearance-none"
                      value={formData.unidadeMedida}
                      onChange={handleChange}
                    >
                      <option>Unidade</option>
                      <option>m²</option>
                      <option>Kg</option>
                      <option>Litro</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                    Preço do produto *
                  </label>
                  <input
                    type="number"
                    name="preco"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left"
                    value={formData.preco}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <br />
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                  Descrição do produto
                </label>
                <textarea
                  name="descricao"
                  placeholder="Adicione uma descrição detalhada do produto"
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none text-left"
                  value={formData.descricao}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <input
                  type="checkbox"
                  name="ativo"
                  className="w-5 h-5 text-[#007EA7]"
                  checked={formData.ativo}
                  onChange={handleChange}
                />
                <label className="text-sm text-gray-900">Produto Ativo</label>
              </div>
            </div>
          )}

          {/* Etapa 1 - Atributos */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 text-left">
                    Atributos do Produto
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 text-left">
                    Adicione características específicas
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddAtributo}
                  startIcon={<Plus className="w-4 h-4" />}
                >
                  Adicionar
                </Button>
              </div>

              {formData.atributos.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                  <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique em "Adicionar" para criar atributos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.atributos.map((attr, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-2 text-left">
                          Tipo
                        </label>
                        <input
                          type="text"
                          placeholder="Cor, Tamanho..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left"
                          value={attr.tipo}
                          onChange={(e) =>
                            handleAtributoChange(index, "tipo", e.target.value)
                          }
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-2 text-left">
                          Valor
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Azul, Grande"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left"
                          value={attr.valor}
                          onChange={(e) =>
                            handleAtributoChange(index, "valor", e.target.value)
                          }
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveAtributo(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg mt-6 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Etapa 2 - Métricas */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">
                  Métricas de Estoque
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Defina limites de estoque
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border">
                  <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                    Nível Mínimo
                  </label>
                  <input
                    type="number"
                    name="nivelMinimo"
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left"
                    value={formData.nivelMinimo}
                    onChange={handleChange}
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg border">
                  <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                    Nível Máximo
                  </label>
                  <input
                    type="number"
                    name="nivelMaximo"
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left"
                    value={formData.nivelMaximo}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3 - Estoque */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">
                  Estoque Inicial
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Configure o estoque inicial (opcional)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                    Quantidade Total
                  </label>
                  <input
                    type="number"
                    name="qtdTotal"
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left"
                    value={formData.qtdTotal}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
                    Localização
                  </label>
                  <input
                    type="text"
                    name="localizacao"
                    placeholder="Ex: Prateleira A3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left"
                    value={formData.localizacao}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t bg-gray-50 flex justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                Voltar
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={loading}
              >
                Próxima Etapa
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>{isEditing ? "Salvar Alterações" : "Salvar Produto"}</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovoProdutoModal;
