/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Search, 
  TrendingUp, 
  BarChart3, 
  CheckCircle2,
  Rocket,
  Shield,
  Zap,
  Crown,
  Award,
  Target,
  MousePointer2,
  Layout,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Video,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface SlideProps {
  children: React.ReactNode;
  isActive: boolean;
  key?: React.Key;
}

const Slide = ({ children, isActive }: SlideProps) => {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
          transition={{ 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1] // Custom easeOutExpo
          }}
          className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
        >
          <div className="min-h-full w-full flex flex-col items-center justify-center p-6 md:p-16 pt-24 md:pt-24 pb-44 md:pb-32">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface PlanCardProps {
  title: string;
  price: string;
  features: string[];
  icon: React.ElementType;
  gradient: string;
  delay: number;
}

const PlanCard = ({ title, price, features, icon: Icon, gradient, delay }: PlanCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`flex flex-col p-4 md:p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl ${gradient} text-white h-full min-h-[320px] md:min-h-[450px]`}
  >
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <div className="p-2 md:p-3 bg-white/20 rounded-xl">
        <Icon size={20} className="md:hidden" />
        <Icon size={24} className="hidden md:block" />
      </div>
      <div className="text-right">
        <div className="text-[8px] md:text-[10px] uppercase tracking-widest opacity-60 mb-0.5">Monthly</div>
        <span className="text-xl md:text-2xl font-bold">AED {price}</span>
      </div>
    </div>
    <h3 className="text-lg md:text-xl font-black mb-3 md:mb-4 tracking-tight uppercase">{title}</h3>
    <ul className="space-y-2 md:space-y-2.5 flex-grow">
      {features.map((feature: string, idx: number) => (
        <li key={idx} className="flex items-start gap-2 text-[11px] md:text-sm opacity-90 leading-tight">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-blue-300" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Veo Animation State
  const [veoImage, setVeoImage] = useState<string | null>(null);
  const [veoVideoUrl, setVeoVideoUrl] = useState<string | null>(null);
  const [veoLoading, setVeoLoading] = useState(false);
  const [veoStatus, setVeoStatus] = useState("");
  const [veoError, setVeoError] = useState<string | null>(null);

  const handleVeoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVeoImage(reader.result as string);
        setVeoVideoUrl(null);
        setVeoError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVeoVideo = async () => {
    if (!veoImage) return;

    try {
      setVeoLoading(true);
      setVeoError(null);
      setVeoStatus("Initializing AI...");

      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }

      let base64Data = "";
      let mimeType = "image/png";

      if (veoImage.startsWith('data:')) {
        base64Data = veoImage.split(',')[1];
        mimeType = veoImage.split(';')[0].split(':')[1];
      } else {
        // Handle remote URL (sample images)
        setVeoStatus("Fetching sample image...");
        const imgResponse = await fetch(veoImage);
        const blob = await imgResponse.blob();
        mimeType = blob.type;
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }

      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });

      setVeoStatus("Submitting to Veo...");
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'Animate this image with smooth cinematic motion, high quality, professional lighting',
        image: {
          imageBytes: base64Data,
          mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setVeoStatus("Generating video (this may take a minute)...");
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': (process.env as any).API_KEY,
          },
        });
        const blob = await response.blob();
        setVeoVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setVeoError("API Key session expired. Please re-select your key.");
        await window.aistudio.openSelectKey();
      } else {
        setVeoError("Failed to generate video. Please try again.");
      }
    } finally {
      setVeoLoading(false);
      setVeoStatus("");
    }
  };

  const getLogoUrl = (id: number) => {
    return `${window.location.origin}/input_file_${id}.png`;
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slides = [
    // Slide 1: Title
    <div key="title" className="text-center space-y-6 md:space-y-10 max-w-5xl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-block px-4 py-1.5 md:px-6 md:py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] md:text-sm font-bold tracking-widest uppercase mb-2 md:mb-4"
      >
        Digital Strategy 2026
      </motion.div>
      <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white uppercase leading-tight">
        ART NOVO <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tighter">
          DIGITAL EVOLUTION
        </span>
      </h1>
      <p className="text-base md:text-xl text-blue-100/70 max-w-2xl mx-auto font-light leading-relaxed px-4">
        A comprehensive multi-platform growth strategy engineered by <a href="https://gnext.ae" target="_blank" rel="noopener noreferrer" className="font-bold text-white tracking-wider hover:text-blue-400 transition-colors underline underline-offset-4 decoration-white/20">GNEXT</a> & <a href="https://gxlocate.com" target="_blank" rel="noopener noreferrer" className="font-bold text-white tracking-wider hover:text-blue-400 transition-colors underline underline-offset-4 decoration-white/20">GXLOCATE</a>.
      </p>
      <div className="flex justify-center items-center gap-6 md:gap-12 pt-6 md:pt-12">
        <div className="flex flex-col items-center gap-3 md:gap-4">
          <a href="https://gnext.ae" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3 md:gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-400/20 shadow-lg shadow-blue-500/5 group-hover:bg-blue-500/20 transition-all">
              <Rocket size={32} className="text-blue-400 md:hidden" />
              <Rocket size={40} className="text-blue-400 hidden md:block" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-blue-300/60 uppercase group-hover:text-blue-300 transition-colors">GNEXT</span>
          </a>
        </div>
        <div className="w-px h-16 md:h-24 bg-white/10" />
        <div className="flex flex-col items-center gap-3 md:gap-4">
          <a href="https://gxlocate.com" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3 md:gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-400/20 shadow-lg shadow-cyan-500/5 group-hover:bg-cyan-500/20 transition-all">
              <Globe size={32} className="text-cyan-400 md:hidden" />
              <Globe size={40} className="text-cyan-400 hidden md:block" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-blue-300/60 uppercase group-hover:text-blue-300 transition-colors">GXLOCATE</span>
          </a>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={nextSlide}
        className="mt-8 px-8 py-3 rounded-full bg-blue-600 text-white font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
      >
        Explore Strategy
      </motion.button>
    </div>,

    // Slide 2: Award-Winning Credentials
    <div key="credentials" className="w-full max-w-6xl space-y-6 md:space-y-10">
      <div className="text-center space-y-2 md:space-y-3">
        <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">AWARD-WINNING CREDENTIALS</h2>
        <p className="text-sm md:text-lg text-blue-100/60">Recognized globally by TechBehemoths for excellence in digital transformation.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Award size={100} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
              <Rocket size={20} className="text-blue-400" />
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase">GNEXT LLC</div>
          </div>
          <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wide">
            <a href="https://gnext.ae" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              GNEXT LLC
            </a>
          </h3>
          <ul className="grid grid-cols-1 gap-3">
            {[
              { text: "Global Winner: WordPress Development", link: "https://techbehemoths.com/awards-2025/winners/wordpress/gnext-llc" },
              { text: "Global Winner: Search Engine Optimization (SEO)", link: "https://techbehemoths.com/awards-2025/winners/seo/gnext-llc" },
              { text: "Global Winner: Pay Per Click (PPC) Management", link: "https://techbehemoths.com/awards-2025/winners/pay-per-click/gnext-llc" },
              "Top Rated Digital Agency in Dubai, UAE",
              "Excellence in Strategic Brand Growth"
            ].map((award, i) => (
              <li key={i} className="flex items-center gap-3 text-sm md:text-base text-blue-100/80">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                  <Award size={16} className="text-yellow-500" />
                </div>
                {typeof award === 'string' ? award : (
                  <a href={award.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                    {award.text} <ExternalLink size={12} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Award size={100} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
              <Globe size={20} className="text-cyan-400" />
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase">GXLOCATE</div>
          </div>
          <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wide">
            <a href="https://gxlocate.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              GXLOCATE
            </a>
          </h3>
          <ul className="grid grid-cols-1 gap-3">
            {[
              { text: "Global Winner: WordPress Development", link: "https://techbehemoths.com/awards-2025/winners/wordpress/gxlocate" },
              { text: "Global Winner: Web Development Services", link: "https://techbehemoths.com/awards-2025/winners/web-development/gxlocate" },
              { text: "Global Winner: Search Engine Optimization (SEO)", link: "https://techbehemoths.com/awards-2025/winners/seo/gxlocate" },
              "Excellence in Local SEO & GBP Optimization",
              "Top Rated for Local Business Visibility"
            ].map((award, i) => (
              <li key={i} className="flex items-center gap-3 text-sm md:text-base text-blue-100/80">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                  <Award size={16} className="text-yellow-500" />
                </div>
                {typeof award === 'string' ? award : (
                  <a href={award.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                    {award.text} <ExternalLink size={12} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>,

    // Slide 3: Client Focus: ART NOVO
    <div key="client" className="w-full max-w-5xl space-y-8 md:space-y-12">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        <div className="flex-1 space-y-4 md:space-y-6">
          <h2 className="text-2xl md:text-4xl font-black text-white uppercase leading-tight">Strategic Focus: <br /><span className="text-blue-400">ARTNOVO.COM</span></h2>
          <p className="text-sm md:text-lg text-blue-100/70 leading-relaxed font-light">
            ART NOVO represents a unique blend of creativity and commerce. Our 2026 strategy focuses on translating this artistic value into digital dominance through precision engineering.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Target className="text-blue-400 mb-2" size={20} />
              <div className="text-white font-bold text-sm md:text-base uppercase">Target Audience</div>
              <div className="text-[10px] md:text-xs text-blue-100/50">High-intent art collectors & interior designers</div>
            </div>
            <div className="p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <TrendingUp className="text-blue-400 mb-2" size={20} />
              <div className="text-white font-bold text-sm md:text-base uppercase">Growth Goal</div>
              <div className="text-[10px] md:text-xs text-blue-100/50">200% Increase in Organic Conversions</div>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full max-w-sm md:max-w-none">
          <div className="relative p-1 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-600 shadow-xl shadow-blue-500/10">
            <div className="bg-[#020617] rounded-[1.9rem] md:rounded-[2.4rem] p-6 md:p-10 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-5">
                <Globe size={32} className="text-blue-400 md:hidden" />
                <Globe size={40} className="text-blue-400 hidden md:block" />
              </div>
              <div className="text-xl md:text-2xl font-black text-white tracking-widest uppercase">ARTNOVO.COM</div>
              <div className="text-[10px] md:text-xs text-blue-100/40 mt-2 md:mt-3 italic font-serif">"Where Art Meets Digital Excellence"</div>
            </div>
          </div>
        </div>
      </div>
    </div>,

    // Slide 4: Service Ecosystem
    <div key="services" className="w-full max-w-6xl space-y-6 md:space-y-10">
      <div className="text-center space-y-2 md:space-y-3">
        <h2 className="text-2xl md:text-4xl font-black text-white uppercase">Service Ecosystem</h2>
        <p className="text-sm md:text-lg text-blue-100/60">A detailed breakdown of our 2026 management scope for ART NOVO.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[
          { icon: Search, title: "GBP MANAGEMENT", desc: "Google Business Profile optimization, local citations, review management, weekly updates, and map ranking dominance." },
          { icon: Layout, title: "WEBSITE (WORDPRESS)", desc: "Technical maintenance, speed optimization, security patches, regular content updates, and custom feature development." },
          { icon: Instagram, title: "SOCIAL MEDIA", desc: "Strategic content for FB, IG, and LinkedIn. Professional engagement, brand storytelling, and high-quality community growth." },
          { icon: BarChart3, title: "SEO OPERATIONS", desc: "Comprehensive on-page, off-page, and technical SEO. Keyword research, link building, and content optimization for search dominance." },
          { icon: MousePointer2, title: "ADS & PPC HANDLING", desc: "Professional management of Google Ads and Social Ads. Data-driven targeting to maximize ROI and high-quality lead generation." },
          { icon: TrendingUp, title: "ANALYTICS & ROI", desc: "Detailed monthly reporting with actionable insights. Real-time performance tracking and strategic adjustments for growth." }
        ].map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:bg-blue-500/20 transition-colors">
              <s.icon className="text-blue-400" size={24} />
            </div>
            <h4 className="text-lg font-black text-white mb-3 uppercase tracking-tight">{s.title}</h4>
            <p className="text-sm text-blue-100/60 leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>,

    // Slide 5: Plan 1 - ESSENTIAL
    <div key="plan1" className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
      <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left">
        <div className="inline-block px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">TIER ONE</div>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase">ESSENTIAL</h2>
        <p className="text-sm md:text-lg text-blue-100/70 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
          The foundation for ART NOVO's digital presence. Designed to maintain consistency and ensure your brand is found by local customers.
        </p>
        <div className="flex items-baseline justify-center lg:justify-start gap-2">
          <span className="text-3xl md:text-4xl font-black text-blue-400">AED 700</span>
          <span className="text-xs md:text-sm text-blue-100/40 uppercase tracking-widest">/ month</span>
        </div>
      </div>
      <div className="flex-1 w-full max-w-md">
        <PlanCard 
          title="ESSENTIAL PLAN"
          price="700"
          icon={Shield}
          features={[
            "GBP Full Optimization & Setup",
            "Weekly GBP Updates & Postings",
            "FB & IG (2 posts/week)",
            "Monthly Performance Reporting",
            "Basic Website Security",
            "Local Citation Monitoring",
            "Google Map Pin Optimization",
            "Basic Review Monitoring",
            "Technical Health Check",
            "Basic Keyword Tracking",
            "Image Optimization"
          ]}
          gradient="bg-gradient-to-br from-blue-600/40 to-blue-800/40"
          delay={0.1}
        />
      </div>
    </div>,

    // Slide 6: Plan 2 - GROWTH
    <div key="plan2" className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
      <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left">
        <div className="inline-block px-3 py-1 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">TIER TWO</div>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase">GROWTH</h2>
        <p className="text-sm md:text-lg text-blue-100/70 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
          Accelerate ART NOVO's reach and engagement. This tier introduces active SEO and advertising to drive measurable growth.
        </p>
        <div className="flex items-baseline justify-center lg:justify-start gap-2">
          <span className="text-3xl md:text-4xl font-black text-blue-400">AED 1,500</span>
          <span className="text-xs md:text-sm text-blue-100/40 uppercase tracking-widest">/ month</span>
        </div>
      </div>
      <div className="flex-1 w-full max-w-md">
        <PlanCard 
          title="GROWTH PLAN"
          price="1,500"
          icon={Zap}
          features={[
            "Full GBP Optimization",
            "FB, IG & LI (3 posts/week)",
            "On-page SEO Operations",
            "Ads Setup & Monitoring",
            "Website Content Updates",
            "Competitor Analysis",
            "Monthly Strategy Consultation",
            "Basic Schema Markup",
            "GSC & Analytics Setup",
            "Meta Pixel & GA4 Tracking",
            "Monthly Blog Post",
            "Basic Backlink Strategy"
          ]}
          gradient="bg-gradient-to-br from-blue-500/50 to-indigo-700/50"
          delay={0.1}
        />
      </div>
    </div>,

    // Slide 7: Plan 3 - PROFESSIONAL
    <div key="plan3" className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
      <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left">
        <div className="inline-block px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">TIER THREE</div>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase">PROFESSIONAL</h2>
        <p className="text-sm md:text-lg text-blue-100/70 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
          Comprehensive management for ART NOVO. Advanced SEO and full-scale advertising management for maximum ROI.
        </p>
        <div className="flex items-baseline justify-center lg:justify-start gap-2">
          <span className="text-3xl md:text-4xl font-black text-blue-400">AED 2,500</span>
          <span className="text-xs md:text-sm text-blue-100/40 uppercase tracking-widest">/ month</span>
        </div>
      </div>
      <div className="flex-1 w-full max-w-md">
        <PlanCard 
          title="PROFESSIONAL PLAN"
          price="2,500"
          icon={Rocket}
          features={[
            "Daily Social Media Posts",
            "Advanced Technical SEO",
            "Full Ads Management",
            "Performance Optimization",
            "Bi-weekly Strategy Calls",
            "Conversion Optimization",
            "Competitor Traffic Analysis",
            "Advanced Schema Markup",
            "Local Link Building",
            "Custom Reporting Dashboard",
            "Heatmap Setup & Analysis",
            "A/B Testing Implementation",
            "Advanced Lead Tracking"
          ]}
          gradient="bg-gradient-to-br from-indigo-600/60 to-purple-800/60"
          delay={0.1}
        />
      </div>
    </div>,

    // Slide 8: Plan 4 - ELITE
    <div key="plan4" className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
      <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left">
        <div className="inline-block px-3 py-1 rounded-md bg-blue-400/20 text-blue-300 text-[10px] font-black uppercase tracking-widest">TIER FOUR</div>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase">ELITE</h2>
        <p className="text-sm md:text-lg text-blue-100/70 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
          The ultimate digital partnership for ART NOVO. A dedicated team handling every aspect of your digital presence.
        </p>
        <div className="flex items-baseline justify-center lg:justify-start gap-2">
          <span className="text-3xl md:text-4xl font-black text-blue-400">AED 3,000</span>
          <span className="text-xs md:text-sm text-blue-100/40 uppercase tracking-widest">/ month</span>
        </div>
      </div>
      <div className="flex-1 w-full max-w-md">
        <PlanCard 
          title="ELITE PLAN"
          price="3,000"
          icon={Crown}
          features={[
            "Everything in Professional",
            "Custom Landing Pages",
            "Video/Reels Production",
            "Advanced ROI Attribution",
            "Dedicated Account Manager",
            "Priority Support 24/7",
            "Quarterly Business Review",
            "Influencer Outreach",
            "E-commerce SEO Mastery",
            "Monthly Strategy Session",
            "Full Digital PR Support",
            "Competitor Gap Analysis",
            "Custom API Integrations"
          ]}
          gradient="bg-gradient-to-br from-blue-400/70 to-blue-600/70"
          delay={0.1}
        />
      </div>
    </div>,

    // Slide 9: Strategic Roadmap 2026
    <div key="roadmap" className="w-full max-w-6xl space-y-8 md:space-y-12">
      <div className="text-center space-y-2 md:space-y-3">
        <h2 className="text-2xl md:text-4xl font-black text-white uppercase">Strategic Roadmap</h2>
        <p className="text-sm md:text-lg text-blue-100/60">Our phased approach to ART NOVO's digital success in 2026.</p>
      </div>
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 hidden md:block" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { phase: "PHASE 01", title: "AUDIT & SETUP", desc: "Full technical audit, GBP optimization, tracking setup, and baseline reporting." },
            { phase: "PHASE 02", title: "CONTENT ENGINE", desc: "Social media launch, website content strategy, and initial SEO implementation." },
            { phase: "PHASE 03", title: "SEO & ADS PUSH", desc: "Aggressive SEO push, PPC campaign launch, and performance monitoring." },
            { phase: "PHASE 04", title: "SCALE & ROI", desc: "ROI analysis, scaling high-performing channels, and conversion optimization." }
          ].map((r, i) => (
            <div key={i} className="relative z-10 p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-all">
              <div className="text-blue-400 font-black text-xs mb-3 tracking-widest">{r.phase}</div>
              <h4 className="text-lg font-black text-white mb-3 uppercase">{r.title}</h4>
              <p className="text-xs text-blue-100/50 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,

    // Slide 10: Contact & Next Steps
    <div key="contact" className="w-full max-w-6xl space-y-8 md:space-y-12">
      <div className="text-center space-y-3 md:space-y-4">
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">LET'S BUILD YOUR FUTURE</h2>
        <p className="text-base md:text-xl text-blue-100/60 max-w-2xl mx-auto font-light px-4">
          Partner with award-winning experts to elevate <span className="font-bold text-white">ART NOVO</span> to new heights in 2026.
        </p>
      </div>
      <div className="max-w-2xl mx-auto w-full">
        <div className="p-6 md:p-10 rounded-3xl bg-white/5 border border-white/10 text-center space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-3">
              <Mail className="text-blue-400" size={20} />
              <span className="text-white font-bold text-sm md:text-base">INFO@GNEXT.AE</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-blue-400" size={20} />
              <span className="text-white font-bold text-sm md:text-base">+971 50 611 5911</span>
            </div>
          </div>
          <div className="h-px bg-white/10 w-full" />
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <a href="https://gnext.ae" target="_blank" rel="noopener noreferrer" className="text-blue-300 font-black text-xs md:text-sm tracking-widest uppercase hover:text-white transition-colors">GNEXT.AE</a>
            <a href="https://gxlocate.com" target="_blank" rel="noopener noreferrer" className="text-blue-300 font-black text-xs md:text-sm tracking-widest uppercase hover:text-white transition-colors">GXLOCATE.COM</a>
          </div>
        </div>
      </div>
    </div>,
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div id="presentation-container" className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-900/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50 bg-gradient-to-b from-[#020617] via-[#020617]/80 to-transparent">
        <AnimatePresence>
          {(currentSlide === 0 || currentSlide === slides.length - 1) && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-3 md:gap-6"
            >
              <a href="https://gnext.ae" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-400/30 group-hover:bg-blue-500/30 transition-all">
                  <Rocket size={12} className="text-blue-400 md:hidden" />
                  <Rocket size={16} className="text-blue-400 hidden md:block" />
                </div>
                <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-white uppercase group-hover:text-blue-400 transition-colors">GNEXT</span>
              </a>
              <div className="w-px h-4 md:h-6 bg-white/20" />
              <a href="https://gxlocate.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30 group-hover:bg-cyan-500/30 transition-all">
                  <Globe size={12} className="text-cyan-400 md:hidden" />
                  <Globe size={16} className="text-cyan-400 hidden md:block" />
                </div>
                <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-white uppercase group-hover:text-blue-400 transition-colors">GXLOCATE</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="relative h-screen flex items-center justify-center">
        {slides.map((slide, index) => (
          <Slide key={index} isActive={currentSlide === index}>
            {slide}
          </Slide>
        ))}
      </main>

      {/* Navigation Controls */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent pt-12 pb-6 md:pb-10">
        <div className="flex justify-center items-center gap-4 md:gap-10 px-4 mb-4">
          <button 
            onClick={prevSlide}
            className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-blue-500/50 transition-all active:scale-95 disabled:opacity-30 group"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="md:hidden group-hover:-translate-x-1 transition-transform" />
            <ChevronLeft size={32} className="hidden md:block group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-mono text-blue-300/60 uppercase tracking-[0.3em]">
              {currentSlide + 1} / {slides.length}
            </div>
            <div className="flex gap-1.5 md:gap-3 max-w-[120px] md:max-w-none overflow-x-auto no-scrollbar py-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 md:h-2 rounded-full transition-all duration-500 shrink-0 ${currentSlide === i ? 'w-6 md:w-12 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'w-1.5 md:w-2 bg-white/20 hover:bg-white/40'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={nextSlide}
            className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-blue-500/50 transition-all active:scale-95 group"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="md:hidden group-hover:translate-x-1 transition-transform" />
            <ChevronRight size={32} className="hidden md:block group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Progress Bar (Bottom) */}
      <div className="fixed bottom-0 left-0 h-1.5 bg-white/5 w-full z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
