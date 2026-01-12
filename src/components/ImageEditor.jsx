import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Eraser, Sparkles, Download, RotateCw, Palette } from 'lucide-react';

function ImageEditor() {
  const [image, setImage] = useState(null);
  const [logo, setLogo] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logoPosition, setLogoPosition] = useState('bottom-right');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [maskArea, setMaskArea] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const imageInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addLogo = async () => {
    if (!image || !logo) {
      alert('Selecione uma imagem e um logo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Convert base64 to blob
      const imageBlob = await fetch(image).then(r => r.blob());
      const logoBlob = await fetch(logo).then(r => r.blob());
      
      formData.append('image', imageBlob, 'image.jpg');
      formData.append('logo', logoBlob, 'logo.png');
      formData.append('position', logoPosition);

      const response = await fetch('/api/image/add-logo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setProcessedImage(data.file.url);
      } else {
        alert('Erro ao adicionar logo: ' + data.error);
      }
    } catch (err) {
      console.error('Error adding logo:', err);
      alert('Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = async () => {
    if (!image || selectedFilter === 'none') return;

    setLoading(true);
    try {
      const formData = new FormData();
      const imageBlob = await fetch(image).then(r => r.blob());
      
      formData.append('image', imageBlob, 'image.jpg');
      formData.append('filter', selectedFilter);

      const response = await fetch('/api/image/filter', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setProcessedImage(data.file.url);
      } else {
        alert('Erro ao aplicar filtro: ' + data.error);
      }
    } catch (err) {
      console.error('Error applying filter:', err);
      alert('Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const removeArea = async () => {
    if (!image || !maskArea) {
      alert('Selecione uma área na imagem primeiro');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const imageBlob = await fetch(image).then(r => r.blob());
      
      formData.append('image', imageBlob, 'image.jpg');
      formData.append('x', maskArea.x);
      formData.append('y', maskArea.y);
      formData.append('width', maskArea.width);
      formData.append('height', maskArea.height);

      const response = await fetch('/api/image/remove-area', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setProcessedImage(data.file.url);
        setMaskArea(null);
      } else {
        alert('Erro ao remover área: ' + data.error);
      }
    } catch (err) {
      console.error('Error removing area:', err);
      alert('Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const optimizeImage = async () => {
    if (!image) return;

    setLoading(true);
    try {
      const formData = new FormData();
      const imageBlob = await fetch(image).then(r => r.blob());
      
      formData.append('image', imageBlob, 'image.jpg');

      const response = await fetch('/api/image/optimize', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setProcessedImage(data.file.url);
      } else {
        alert('Erro ao otimizar: ' + data.error);
      }
    } catch (err) {
      console.error('Error optimizing:', err);
      alert('Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setMaskArea({ x, y, width: 0, height: 0 });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !maskArea || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    setMaskArea({
      ...maskArea,
      width: currentX - maskArea.x,
      height: currentY - maskArea.y
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const filters = [
    { value: 'none', label: 'Sem Filtro' },
    { value: 'grayscale', label: 'Preto e Branco' },
    { value: 'sepia', label: 'Sépia' },
    { value: 'brighten', label: 'Clarear' },
    { value: 'darken', label: 'Escurecer' },
    { value: 'saturate', label: 'Saturar' },
    { value: 'desaturate', label: 'Dessaturar' }
  ];

  const positions = [
    { value: 'top-left', label: 'Superior Esquerdo' },
    { value: 'top-right', label: 'Superior Direito' },
    { value: 'bottom-left', label: 'Inferior Esquerdo' },
    { value: 'bottom-right', label: 'Inferior Direito' },
    { value: 'center', label: 'Centro' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Editor de Imagens</h2>
        <p className="text-gray-600 mt-1">
          Edite imagens, adicione seu logo e remova elementos indesejados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem Principal
            </label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-gray-600">
                {image ? 'Trocar Imagem' : 'Carregar Imagem'}
              </span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo (opcional)
            </label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">
                {logo ? 'Trocar Logo' : 'Carregar Logo'}
              </span>
            </button>
          </div>

          {/* Logo Position */}
          {logo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posição do Logo
              </label>
              <select
                value={logoPosition}
                onChange={(e) => setLogoPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {positions.map(pos => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtros
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {filters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {logo && (
              <button
                onClick={addLogo}
                disabled={loading || !image}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                <span>Adicionar Logo</span>
              </button>
            )}

            <button
              onClick={applyFilter}
              disabled={loading || !image || selectedFilter === 'none'}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Palette className="w-5 h-5" />
              <span>Aplicar Filtro</span>
            </button>

            <button
              onClick={removeArea}
              disabled={loading || !image || !maskArea}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Eraser className="w-5 h-5" />
              <span>Remover Área Selecionada</span>
            </button>

            <button
              onClick={optimizeImage}
              disabled={loading || !image}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCw className="w-5 h-5" />
              <span>Otimizar para Web</span>
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Preview
          </label>
          
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
            {(processedImage || image) ? (
              <div className="relative w-full h-full">
                <img
                  src={processedImage || image}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                
                {/* Canvas for area selection */}
                {image && !processedImage && (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="absolute inset-0 cursor-crosshair"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      opacity: maskArea ? 0.5 : 0
                    }}
                  />
                )}
                
                {/* Mask visualization */}
                {maskArea && (
                  <div
                    className="absolute border-2 border-red-500 bg-red-200 bg-opacity-30"
                    style={{
                      left: maskArea.x,
                      top: maskArea.y,
                      width: maskArea.width,
                      height: maskArea.height
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                  <p>Nenhuma imagem carregada</p>
                </div>
              </div>
            )}
          </div>

          {processedImage && (
            <a
              href={processedImage}
              download="edited-image.jpg"
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Baixar Imagem</span>
            </a>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">💡 Dica</h3>
            <p className="text-sm text-gray-700">
              Para remover logos ou objetos indesejados, clique e arraste sobre a área na imagem acima, depois clique em "Remover Área Selecionada".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageEditor;
