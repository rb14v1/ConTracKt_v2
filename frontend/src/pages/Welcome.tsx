import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, ShieldCheck, Zap, LayoutTemplate } from 'lucide-react';

export const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-900 font-sans">
      <div className="max-w-4xl text-center p-8">
        {/* Logo */}
        <div className="bg-white p-4 rounded-2xl w-24 h-24 mx-auto flex items-center justify-center mb-8 shadow-sm border border-gray-100">
          <Bot className="w-12 h-12 text-teal-600" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-900">
          ConTrackt <span className="text-teal-600">AI</span>
        </h1>
        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Enterprise-grade semantic search for your sensitive documentation.
          <br /> Secure, precise, and integrated.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 text-left">
          {[
            { icon: <ShieldCheck />, title: "Secure Storage", desc: "Private S3 & Encryption" },
            { icon: <Zap />, title: "Instant Search", desc: "Powered by pgvector" },
            { icon: <LayoutTemplate />, title: "Context Aware", desc: "Intelligent summarization" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition duration-300">
              <div className="text-teal-600 mb-3 bg-teal-50 w-fit p-2 rounded-lg">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/chat')}
          className="group bg-teal-600 hover:bg-teal-700 text-white text-lg font-medium px-8 py-4 rounded-lg transition-all flex items-center gap-2 mx-auto shadow-lg shadow-teal-600/20"
        >
          Launch Workspace <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
        </button>
      </div>
    </div>
  );
};