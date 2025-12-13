// Welcome.tsx (Refined)  — Version-1 Style
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, ShieldCheck, Zap, LayoutTemplate } from 'lucide-react';

export const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--v1-bg)] flex items-center justify-center text-[var(--v1-text)] font-sans px-6">
      <div className="max-w-4xl text-center">

        {/* Logo */}
        <div className="bg-white p-4 rounded-xl w-20 h-20 mx-auto flex items-center justify-center mb-6 border border-[var(--v1-border)] shadow-sm">
          <Bot className="w-10 h-10 text-[var(--v1-teal)]" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          ConTrackt <span className="text-[var(--v1-teal)]">AI</span>
        </h1>

        <p className="text-base text-[var(--v1-text-light)] mb-10 max-w-2xl mx-auto leading-relaxed">
          Enterprise-grade semantic search for critical business documentation.  
          Secure, precise, and efficient.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 text-left">
          {[
            { icon: <ShieldCheck />, title: "Secure Storage", desc: "Encrypted S3 storage" },
            { icon: <Zap />, title: "Instant Search", desc: "Powered by pgvector" },
            { icon: <LayoutTemplate />, title: "Context Aware", desc: "Accurate summarisation" }
          ].map((item, i) => (
            <div 
              key={i} 
              className="bg-white p-5 rounded-xl border border-[var(--v1-border)] hover:border-[var(--v1-teal)] transition shadow-sm"
            >
              <div className="text-[var(--v1-teal)] mb-3 bg-teal-50 w-fit p-2 rounded-lg">
                {item.icon}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-[var(--v1-text-light)]">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/chat')}
          className="bg-[var(--v1-teal)] hover:bg-[var(--v1-teal-dark)] text-white text-base font-medium px-7 py-3 rounded-lg transition inline-flex items-center gap-2 shadow-md"
        >
          Launch Workspace 
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
