
import React, { useRef, useEffect, useState } from 'react';

interface ColoringCanvasProps {
  imageSrc: string;
  onFinish: (canvasDataUrl: string) => void;
  language: 'ar' | 'en';
}

const ColoringCanvas: React.FC<ColoringCanvasProps> = ({ imageSrc, onFinish, language }) => {
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(12);
  const [isEraser, setIsEraser] = useState(false);

  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#ffa500', '#8b4513', 
    '#000000', '#ffc0cb'
  ];

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
    };
  }, [imageSrc]);

  /**
   * وظيفة لحساب الإحداثيات الدقيقة مع مراعاة اختلاف حجم العرض (CSS) عن حجم الرسم الفعلي (500px)
   */
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    
    // معامل التناسب مهم جداً للموبايل لأن العرض يكون أصغر من 500 بكسل
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      // التعامل مع اللمس في الموبايل
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // التعامل مع الماوس
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const coords = getCoordinates(e, canvas);
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    
    // منع التمرير الافتراضي في الموبايل عند بدء الرسم
    if ('touches' in e) {
      // المتصفح يتعامل مع touch-none بالفعل لكن للاحتياط
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    // تحديث المسار لجعل الخطوط ناعمة
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const clearCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFinish = () => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 500;
    finalCanvas.height = 500;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx && bgCanvasRef.current && drawingCanvasRef.current) {
      finalCtx.drawImage(bgCanvasRef.current, 0, 0);
      finalCtx.drawImage(drawingCanvasRef.current, 0, 0);
      onFinish(finalCanvas.toDataURL());
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full animate-in zoom-in duration-300">
      <div className="flex flex-wrap justify-center gap-2 p-4 bg-white rounded-2xl shadow-inner border-2 border-indigo-100 w-full max-w-md">
        {colors.map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setIsEraser(false); }}
            className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${color === c && !isEraser ? 'border-gray-800 scale-125 ring-2 ring-indigo-200' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <button
          onClick={() => setIsEraser(true)}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl hover:scale-110 transition-all ${isEraser ? 'border-gray-800 scale-125 bg-pink-100 ring-2 ring-pink-200' : 'border-transparent bg-white shadow-sm'}`}
          title={language === 'ar' ? 'ممحاة' : 'Eraser'}
        >
          🧽
        </button>
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-bold text-sm hover:bg-red-100 transition border border-red-100"
        >
          {language === 'ar' ? 'مسح تلويني' : 'Clear My Art'}
        </button>
      </div>

      <div className="relative bg-white border-8 border-indigo-200 rounded-[40px] shadow-2xl cursor-crosshair touch-none w-[320px] h-[320px] sm:w-[500px] sm:h-[500px]">
        {/* طبقة الخلفية (الرسمة الأصلية) */}
        <canvas
          ref={bgCanvasRef}
          width={500}
          height={500}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        {/* طبقة الرسم (تلوين الطفل) */}
        <canvas
          ref={drawingCanvasRef}
          width={500}
          height={500}
          className="absolute top-0 left-0 w-full h-full opacity-70 sm:opacity-80"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleFinish}
          className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-2xl rounded-3xl shadow-xl hover:shadow-2xl transition transform active:scale-95 border-b-8 border-orange-700"
        >
          {language === 'ar' ? 'خلصت يا معلمتي! ✨' : 'Done Teacher! ✨'}
        </button>
      </div>
    </div>
  );
};

export default ColoringCanvas;
