import React, { useRef, useState } from 'react';
import { Crown, Sparkles, Trophy, Upload, Camera, Loader2 } from 'lucide-react';
import { RaffleSettings } from '../types/raffle';
import { updateRaffleSettings } from '../lib/db';
import { compressImageFile } from '../lib/imageUtils';

interface HeroPrizesProps {
  settings: RaffleSettings;
}

export const HeroPrizes: React.FC<HeroPrizesProps> = ({ settings }) => {
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const fileInputRef3 = useRef<HTMLInputElement | null>(null);
  const [uploadingPrize, setUploadingPrize] = useState<number | null>(null);

  const handleFileUpload = async (prizeNumber: 1 | 2 | 3, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPrize(prizeNumber);
      const dataUrl = await compressImageFile(file, 900, 900, 0.82);
      if (prizeNumber === 1) {
        updateRaffleSettings({ prize_1_img: dataUrl });
      } else if (prizeNumber === 2) {
        updateRaffleSettings({ prize_2_img: dataUrl });
      } else {
        updateRaffleSettings({ prize_3_img: dataUrl });
      }
    } catch (err) {
      console.error('Error al subir foto:', err);
    } finally {
      setUploadingPrize(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0F1722] via-[#0A0F16] to-[#05090D] border border-slate-800/80 p-5 md:p-7 shadow-2xl">
      {/* Hidden file inputs to upload from computer */}
      <input
        type="file"
        ref={fileInputRef1}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileUpload(1, e)}
      />
      <input
        type="file"
        ref={fileInputRef2}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileUpload(2, e)}
      />
      <input
        type="file"
        ref={fileInputRef3}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileUpload(3, e)}
      />

      {/* Background basketball arena ambient glow */}
      <div 
        className="absolute inset-0 opacity-15 bg-cover bg-center mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: `url('/images/court_bg.jpg')` }}
      />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Headline */}
      <div className="relative z-10 mb-6">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="font-['Outfit'] italic font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white uppercase drop-shadow-md">
            RIFA <span className="text-[#FF6418]">DEPORTIVA</span>
          </h1>
        </div>
        <p className="text-slate-400 font-medium text-sm sm:text-base mt-1 flex items-center gap-2">
          <span>{settings.total_tickets} oportunidades de ganar</span>
          <span className="text-slate-600">·</span>
          <span className="text-orange-400 font-bold font-mono">RD$ {settings.ticket_price} por boleta</span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-400 hidden sm:inline">Cierre: {settings.closing_date}</span>
        </p>
      </div>

      {/* 3 Prize Cards Grid matching the mockup */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {/* 1ER LUGAR - Tenis de Basket (Most Prominent) */}
        <div className="group relative rounded-xl bg-gradient-to-b from-[#161F2E] to-[#0E1520] border-2 border-orange-500/80 hover:border-orange-500 p-4 transition-all duration-300 shadow-[0_0_25px_rgba(255,100,24,0.22)] hover:shadow-[0_0_35px_rgba(255,100,24,0.35)] flex flex-col justify-between">
          {/* Badge #1 */}
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border border-amber-300">
              <span className="font-['Outfit']">1</span>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              PRIMER LUGAR
            </span>
          </div>

          {/* Product Image Container */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/50 border border-slate-800 flex items-center justify-center p-2 my-2 group/img">
            <img
              src={settings.prize_1_img || '/images/tenis.png'}
              alt={settings.prize_1_title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {/* Quick Upload from computer overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef1.current?.click()}
              className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/80 hover:bg-orange-600 text-white text-[11px] font-semibold border border-slate-700/80 hover:border-orange-500 flex items-center gap-1.5 transition-all shadow-lg"
              title="Cambiar foto de este premio desde tu ordenador"
            >
              <Camera className="w-3 h-3 text-orange-400 group-hover:text-white" />
              <span>Subir foto</span>
            </button>
          </div>

          {/* Label */}
          <div className="mt-2 text-center">
            <h3 className="font-['Outfit'] font-black text-base lg:text-lg text-white uppercase tracking-wide group-hover:text-orange-400 transition-colors">
              1ER LUGAR <span className="text-orange-500">·</span> TENIS DE BASKET
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {settings.prize_1_desc}
            </p>
          </div>
        </div>

        {/* 2DO LUGAR - Balón Molten */}
        <div className="group relative rounded-xl bg-gradient-to-b from-[#131B27] to-[#0C121B] border border-slate-700/80 hover:border-slate-600 p-4 transition-all duration-300 shadow-lg flex flex-col justify-between">
          {/* Badge #2 */}
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-black text-sm flex items-center justify-center border border-slate-600">
              <span className="font-['Outfit']">2</span>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
              SEGUNDO LUGAR
            </span>
          </div>

          {/* Product Image Container */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/50 border border-slate-800 flex items-center justify-center p-2 my-2 group/img">
            <img
              src={settings.prize_2_img || '/images/balon.png'}
              alt={settings.prize_2_title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {/* Quick Upload from computer overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef2.current?.click()}
              className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/80 hover:bg-orange-600 text-white text-[11px] font-semibold border border-slate-700/80 hover:border-orange-500 flex items-center gap-1.5 transition-all shadow-lg"
              title="Cambiar foto de este premio desde tu ordenador"
            >
              <Camera className="w-3 h-3 text-orange-400 group-hover:text-white" />
              <span>Subir foto</span>
            </button>
          </div>

          {/* Label */}
          <div className="mt-2 text-center">
            <h3 className="font-['Outfit'] font-black text-base lg:text-lg text-white uppercase tracking-wide group-hover:text-slate-200 transition-colors">
              2DO LUGAR <span className="text-orange-500">·</span> BALÓN MOLTEN
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {settings.prize_2_desc}
            </p>
          </div>
        </div>

        {/* 3ER LUGAR - Paquete de Medias */}
        <div className="group relative rounded-xl bg-gradient-to-b from-[#131B27] to-[#0C121B] border border-slate-700/80 hover:border-slate-600 p-4 transition-all duration-300 shadow-lg flex flex-col justify-between">
          {/* Badge #3 */}
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-black text-sm flex items-center justify-center border border-slate-600">
              <span className="font-['Outfit']">3</span>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
              TERCER LUGAR
            </span>
          </div>

          {/* Product Image Container */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/50 border border-slate-800 flex items-center justify-center p-2 my-2 group/img">
            <img
              src={settings.prize_3_img || '/images/medias.png'}
              alt={settings.prize_3_title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {/* Quick Upload from computer overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef3.current?.click()}
              className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/80 hover:bg-orange-600 text-white text-[11px] font-semibold border border-slate-700/80 hover:border-orange-500 flex items-center gap-1.5 transition-all shadow-lg"
              title="Cambiar foto de este premio desde tu ordenador"
            >
              <Camera className="w-3 h-3 text-orange-400 group-hover:text-white" />
              <span>Subir foto</span>
            </button>
          </div>

          {/* Label */}
          <div className="mt-2 text-center">
            <h3 className="font-['Outfit'] font-black text-base lg:text-lg text-white uppercase tracking-wide group-hover:text-slate-200 transition-colors">
              3ER LUGAR <span className="text-orange-500">·</span> PAQUETE DE MEDIAS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {settings.prize_3_desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
