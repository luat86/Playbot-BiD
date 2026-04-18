import React, { useState, useEffect, useRef } from 'react';
import { 
  Gavel, Scale, ShieldCheck, Cpu, Send, Loader2, BookOpen, Zap, 
  ChevronRight, Globe, Building2, MessageSquare, Library, FileText, 
  ArrowRight, History, FileWarning, FileCheck, FolderOpen, 
  Search, UserCheck, Tag, X, DollarSign, ListChecks, Calculator, AlertCircle,
  CheckSquare, User, ArrowDown, Plus, Trash2,
  Terminal, Code, Lightbulb, Target, Sparkles, Flag,
  PenLine, Boxes, Layers, Copy, Check, Newspaper, ArrowUpRight, Clock, Share2, Printer,
  GitMerge, Workflow, FileStack, ShieldAlert, ChevronLeft, Layout, GitBranch, BarChart3,
  CircleDot, ChevronDown, ListFilter, Eye, Maximize2, Bot, User as UserIcon,
  Paperclip, File as FileIcon, ImageIcon, Download, Menu, Info
} from 'lucide-react';

// =========================================================================
// ⚙️ SYSTEM CONFIGURATION
// =========================================================================
const APP_CONFIG = {
  botName: "Playbot Legal - BID",
  orgName: "TỔNG CÔNG TY CỔ PHẦN TẬP ĐOÀN ĐẦU TƯ",
  departmentName: "PHÒNG PHÁP CHẾ & THẦU",
  aiModel: "gemini-2.5-flash",
  greetingMessage: "Chào Lãnh đạo! Tôi là **Trợ lý AI Pháp chế Đấu thầu**.\n\nĐể bắt đầu, Lãnh đạo vui lòng kiểm tra thông tin dự án ở **Cột Phải** (tôi đã điền sẵn dữ liệu mẫu), sau đó nhấn nút **PHÂN TÍCH DỰ ÁN** ở góc dưới cùng bên phải để hệ thống AI rà soát và tạo báo cáo.",
  defaultSuggestions: ["Hạn mức chỉ định thầu 2024?", "Quy trình đấu thầu rút gọn?", "Mẫu tờ trình phê duyệt KHLCNT?"]
};

// --- API Utility ---
const callGeminiAPI = async (userQuery, systemPrompt, attachmentData = null) => {
  const apiKey = process.env.GEMINI_API_KEY; // Provided by environment
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${APP_CONFIG.aiModel}:generateContent?key=${apiKey}`;
  
  const parts = [{ text: userQuery }];
  
  if (attachmentData) {
    parts.push({
      inlineData: {
        mimeType: attachmentData.mimeType,
        data: attachmentData.data
      }
    });
  }

  const payload = {
    contents: [{ parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  const fetchWithRetry = async (retries = 0) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API Error");
      }
      
      return await response.json();
    } catch (err) {
      if (retries < 5) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(retries + 1);
      }
      throw err;
    }
  };

  return await fetchWithRetry();
};

// =========================================================================
// 📄 DOCUMENT RENDERER (Decree 30/2020/ND-CP Style)
// =========================================================================
const MarkdownRenderer = ({ content, isReport = false }) => {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className={isReport ? "text-[#000]" : "space-y-3 text-sm leading-relaxed"}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className={`font-semibold mt-5 mb-2 ${isReport ? 'text-[14pt] break-after-avoid text-slate-900' : 'text-base border-l-4 border-current pl-3'}`}>{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className={`font-bold mt-6 mb-3 ${isReport ? 'text-[14pt] break-after-avoid text-slate-900' : 'text-lg'}`}>{line.replace('## ', '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className={`font-bold mt-8 mb-4 ${isReport ? 'text-[14pt] uppercase break-after-avoid text-center text-slate-950' : 'text-xl'}`}>{line.replace('# ', '')}</h1>;
        
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const renderedLine = parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
          return part;
        });

        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={i} className={`flex gap-2 py-1 break-inside-avoid ${isReport ? 'text-[14pt] ml-[1.27cm]' : 'ml-4'}`} style={isReport ? { marginTop: '3pt', marginBottom: '3pt' } : {}}>
              <span className="mt-0.5 font-bold text-current opacity-70">•</span>
              <span className="text-justify">{renderedLine}</span>
            </div>
          );
        }

        if (/^\d+\./.test(line.trim())) {
          return (
            <div key={i} className={`flex gap-2 py-1 font-semibold break-inside-avoid ${isReport ? 'text-[14pt] ml-[1.27cm]' : 'ml-4'}`} style={isReport ? { marginTop: '3pt', marginBottom: '3pt' } : {}}>
              <span className="text-justify">{renderedLine}</span>
            </div>
          );
        }

        if (line.trim() === '---') return <hr key={i} className="my-6 border-current opacity-20" />;
        if (!line.trim()) return <div key={i} className={isReport ? "h-[6pt]" : "h-2"}></div>;

        return (
          <p key={i} className={`text-justify min-h-[1em] ${isReport ? 'text-[14pt]' : ''}`} style={isReport ? { textIndent: '1.27cm', marginTop: '6pt', marginBottom: '6pt', lineHeight: '1.5' } : {}}>
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
};

// =========================================================================
// 🚀 MAIN APPLICATION
// =========================================================================
export default function App() {
  const [setupInfo, setSetupInfo] = useState({
    orgName: APP_CONFIG.orgName,
    departmentName: APP_CONFIG.departmentName,
    isComplete: false
  });

  const [packageInfo, setPackageInfo] = useState({ 
    name: 'Gói thầu số 01: Thi công xây dựng công trình Trụ sở', 
    value: '15.5', 
    source: 'Ngân sách nhà nước', 
    method: 'Đấu thầu rộng rãi',
    methodology: 'Một giai đoạn hai túi hồ sơ',
    process: 'Quy trình chuẩn (Qua mạng)',
    contract: 'Trọn gói'
  });

  const [domesticLaws, setDomesticLaws] = useState(() => {
    const savedLaws = localStorage.getItem('playbot_domestic_laws');
    if (savedLaws) {
      try {
        return JSON.parse(savedLaws);
      } catch (e) {
        console.error("Failed to parse saved laws", e);
      }
    }
    return [
      { id: 'L23', title: 'Luật Đấu thầu số 22/2023/QH15', category: 'Luật' },
      { id: 'N24', title: 'Nghị định 24/2024/NĐ-CP', category: 'Nghị định' },
      { id: 'T06', title: 'Thông tư 06/2024/TT-BKHĐT', category: 'Thông tư' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('playbot_domestic_laws', JSON.stringify(domesticLaws));
  }, [domesticLaws]);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: APP_CONFIG.greetingMessage, suggestions: APP_CONFIG.defaultSuggestions }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false); 
  const [showReport, setShowReport] = useState(false);
  const [lastAnalysisResult, setLastAnalysisResult] = useState(""); 
  const [showAddLawModal, setShowAddLawModal] = useState(false);
  const [newLawInput, setNewLawInput] = useState({ id: '', title: '', category: 'Thông tư' });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdatingLaws, setIsUpdatingLaws] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [suggestedLaws, setSuggestedLaws] = useState([]);
  const [isSuggestingLaws, setIsSuggestingLaws] = useState(false);
  const [chatSuggestedLaws, setChatSuggestedLaws] = useState([]);
  const [isSuggestingChatLaws, setIsSuggestingChatLaws] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hệ thống chỉ hỗ trợ Ảnh hoặc PDF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result.split(',')[1];
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: base64String,
        url: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const copyToClipboard = (text, index) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    textArea.remove();
  };

  const handleSendMessage = async (text = null, isAnalysis = false) => {
    const query = text || inputMessage;
    if (!query && !isAnalysis && !attachment) return;

    if (isAnalysis) {
      setShowReport(true);
      setIsGeneratingReport(true);
      setLastAnalysisResult(""); 
    }

    let finalQuery = query;
    if (isAnalysis) {
      finalQuery = `LẬP BÁO CÁO HÀNH CHÍNH CHI TIẾT cho gói thầu: "${packageInfo.name}" giá trị ${packageInfo.value} tỷ VNĐ. 
      Nguồn vốn: ${packageInfo.source}, Hình thức: ${packageInfo.method}, Phương thức: ${packageInfo.methodology}, Quy trình: ${packageInfo.process}, Loại hợp đồng: ${packageInfo.contract}. 
      Yêu cầu bám sát quy định pháp luật đấu thầu Việt Nam hiện hành.`;
    } else if (!query && attachment) {
      finalQuery = "Hãy phân tích tài liệu đính kèm này dựa trên kiến thức pháp luật đấu thầu.";
    }

    const newUserMessage = { 
      role: 'user', 
      content: isAnalysis ? `Tôi cần phân tích toàn diện chiến lược đấu thầu cho: **${packageInfo.name}**` : (query || "Tôi gửi tài liệu đính kèm."),
      attachment: attachment ? { name: attachment.name, type: attachment.mimeType, url: attachment.url } : null
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    const currentAttachment = attachment;
    setAttachment(null);
    setIsAnalyzing(true);

    const currentLegalContext = domesticLaws.map(l => l.title).join(', ');
    const systemPrompt = `Bạn là ${APP_CONFIG.botName}, Chuyên gia Pháp chế Đấu thầu cấp cao.
Cơ quan: ${setupInfo.orgName} - ${setupInfo.departmentName}.
Kiến thức căn cứ: ${currentLegalContext}.
Nhiệm vụ: Tư vấn pháp lý và lập báo cáo thầu chuẩn Nghị định 30/2020/NĐ-CP.
Định dạng: Markdown. Kết thúc bằng '--- gợi ý:' và 3 câu hỏi gợi ý.`;

    try {
      const data = await callGeminiAPI(finalQuery, systemPrompt, currentAttachment);
      const rawText = (data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Không nhận được phản hồi.").normalize('NFC');
      
      const parts = rawText.split('--- gợi ý:');
      const content = parts[0].trim();
      const suggestions = parts[1] 
        ? parts[1].split('\n').filter(s => s.trim()).map(s => s.replace(/^\d+\.\s*/, '').trim()).slice(0, 3)
        : ["Quy trình thẩm định?", "Lưu ý HSMT?", "Giải quyết kiến nghị?"];

      setMessages(prev => [...prev, { role: 'assistant', content, suggestions }]);
      if (isAnalysis) setLastAnalysisResult(content);
    } catch (error) {
      const errorMsg = `⚠️ Lỗi: ${error.message}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      if (isAnalysis) setLastAnalysisResult(errorMsg);
    } finally {
      setIsAnalyzing(false);
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    const element = document.getElementById('report-paper');
    const safeName = (packageInfo.name || 'Bao_Cao').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const opt = {
      margin: [15, 15, 15, 15],
      filename: `BC_Phap_Ly_${safeName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save().then(() => setIsDownloading(false));
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        window.html2pdf().set(opt).from(element).save().then(() => setIsDownloading(false));
      };
      document.body.appendChild(script);
    }
  };

  const handleAddLaw = () => {
    if (!newLawInput.title) return;
    setDomesticLaws([...domesticLaws, { ...newLawInput, id: `VB${Date.now()}` }]);
    setNewLawInput({ id: '', title: '', category: 'Thông tư' });
    setShowAddLawModal(false);
  };

  const handleDeleteLaw = (idToRemove) => {
    setDomesticLaws(prev => prev.filter(law => law.id !== idToRemove));
  };

  const handleAIUpdateLaws = async () => {
    setIsUpdatingLaws(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${APP_CONFIG.aiModel}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: "Tìm kiếm trên mạng 5 văn bản pháp luật (Luật, Nghị định, Thông tư) mới nhất của Việt Nam về lĩnh vực Đấu thầu và Xây dựng đang có hiệu lực. Trả về định dạng JSON là một mảng các object, mỗi object có 'title' (tên và số hiệu văn bản, ví dụ 'Luật Đấu thầu số 22/2023/QH15') và 'category' (Luật, Nghị định, hoặc Thông tư). Chỉ trả về JSON, không kèm text khác." }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature: 0.2
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error("API Error");
      }
      
      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        rawText = jsonMatch[1];
      }
      
      const newLaws = JSON.parse(rawText);
      
      if (Array.isArray(newLaws)) {
        setDomesticLaws(prev => {
          const updated = [...prev];
          newLaws.forEach(law => {
            if (!updated.some(l => l.title === law.title)) {
              updated.push({ ...law, id: `VB${Date.now()}${Math.floor(Math.random()*1000)}` });
            }
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Lỗi khi AI cập nhật VBPL:", error);
      alert("Không thể cập nhật VBPL tự động lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsUpdatingLaws(false);
    }
  };

  const handleAddSuggestedLaw = (law) => {
    setDomesticLaws(prev => {
      if (!prev.some(l => l.title === law.title)) {
        return [...prev, { id: `VB${Date.now()}${Math.floor(Math.random()*1000)}`, title: law.title, category: law.category || 'Thông tư' }];
      }
      return prev;
    });
    setChatSuggestedLaws(prev => prev.filter(l => l.title !== law.title));
    setSuggestedLaws(prev => prev.filter(l => l.title !== law.title));
  };

  const handleSuggestLaws = async () => {
    setIsSuggestingLaws(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${APP_CONFIG.aiModel}:generateContent?key=${apiKey}`;

      const promptText = `Dựa vào thông tin gói thầu sau:
      - Tên: ${packageInfo.name}
      - Giá trị: ${packageInfo.value} tỷ VNĐ
      - Nguồn vốn: ${packageInfo.source}
      - Hình thức: ${packageInfo.method}
      - Phương thức: ${packageInfo.methodology}
      - Quy trình: ${packageInfo.process}
      - Loại hợp đồng: ${packageInfo.contract}

      Hãy gợi ý 3 văn bản pháp luật (Luật, Nghị định, Thông tư) của Việt Nam liên quan mật thiết nhất cần áp dụng.
      Trả về ĐÚNG định dạng JSON là một mảng các object:
      [{"title": "Tên và số hiệu văn bản", "category": "Luật/Nghị định/Thông tư", "reason": "Lý do ngắn gọn"}]
      Chỉ trả về JSON.`;

      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.2 }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) rawText = jsonMatch[1];

      const newLaws = JSON.parse(rawText);
      if (Array.isArray(newLaws)) {
        setSuggestedLaws(newLaws);
      }
    } catch (error) {
      console.error("Lỗi khi gợi ý VBPL:", error);
    } finally {
      setIsSuggestingLaws(false);
    }
  };

  const handleSuggestChatLaws = async () => {
    if (!inputMessage.trim() && !attachment) return;
    setIsSuggestingChatLaws(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${APP_CONFIG.aiModel}:generateContent?key=${apiKey}`;

      const promptText = `Người dùng đang chuẩn bị hỏi: "${inputMessage}".
      Gói thầu: "${packageInfo.name}", Hình thức: ${packageInfo.method}.
      Hãy gợi ý 2-3 văn bản pháp luật (Luật, Nghị định, Thông tư) của Việt Nam liên quan nhất để đính kèm/áp dụng trả lời câu hỏi này.
      Trả về ĐÚNG định dạng JSON là một mảng các object:
      [{"title": "Tên và số hiệu văn bản", "category": "Luật/Nghị định/Thông tư", "reason": "Lý do ngắn gọn"}]
      Chỉ trả về JSON.`;

      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.2 }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) rawText = jsonMatch[1];

      const newLaws = JSON.parse(rawText);
      if (Array.isArray(newLaws)) {
        setChatSuggestedLaws(newLaws);
      }
    } catch (error) {
      console.error("Lỗi khi gợi ý VBPL:", error);
    } finally {
      setIsSuggestingChatLaws(false);
    }
  };

  // --- RENDERING VIEWS ---
  if (!setupInfo.isComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-10 w-full max-w-md animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/30 mb-5">
              <Scale size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cài đặt Playbot</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">Hệ thống Trợ lý Pháp chế AI</p>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tên Cơ quan / Chủ đầu tư</label>
              <input 
                value={setupInfo.orgName} 
                onChange={e => setSetupInfo({...setupInfo, orgName: e.target.value})}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 text-sm"
                placeholder="VD: TỔNG CÔNG TY ĐẦU TƯ..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Đơn vị soạn thảo</label>
              <input 
                value={setupInfo.departmentName} 
                onChange={e => setSetupInfo({...setupInfo, departmentName: e.target.value})}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 text-sm"
                placeholder="VD: PHÒNG PHÁP CHẾ & THẦU"
              />
            </div>
          </div>
          <button 
            onClick={() => setSetupInfo({...setupInfo, isComplete: true})}
            className="w-full mt-8 p-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group text-sm"
          >
            Bắt đầu làm việc <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* LEFT: SETTINGS */}
      {showLeftSidebar && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setShowLeftSidebar(false)} />
      )}
      <aside className={`absolute md:relative inset-y-0 left-0 transform ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-xl z-50 md:z-30`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20"><Scale size={20} /></div>
            <span className="font-bold text-white tracking-wide text-lg">Playbot<span className="text-blue-400"> BID</span></span>
          </div>
          <button onClick={() => setShowLeftSidebar(false)} className="md:hidden p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <section>
            <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2 mb-4"><Library size={16}/> 1. Thư viện VBPL</label>
            <div className="space-y-2.5">
              {domesticLaws.map(law => (
                <div key={law.id} className="group flex items-start justify-between gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-default">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <Gavel size={16} className="shrink-0 text-blue-400 mt-0.5" />
                    <span className="text-sm font-medium text-slate-300 leading-snug truncate" title={law.title}>{law.title}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteLaw(law.id)}
                    className="text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Xóa văn bản"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setShowAddLawModal(true)} className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-xs font-semibold uppercase text-slate-400 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2 mt-2">
                <Plus size={14} /> Thêm văn bản
              </button>
              <button onClick={handleAIUpdateLaws} disabled={isUpdatingLaws} className="w-full py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold uppercase hover:bg-blue-600/30 hover:text-blue-300 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isUpdatingLaws ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {isUpdatingLaws ? "Đang tìm kiếm..." : "AI Tự cập nhật"}
              </button>
            </div>
          </section>

          <section>
            <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2 mb-4"><Zap size={16}/> 2. Cấu hình thầu</label>
            <div className="space-y-4">
              {[
                { label: 'Hình thức', key: 'method', options: ['Đấu thầu rộng rãi', 'Đấu thầu hạn chế', 'Chỉ định thầu', 'Chào hàng cạnh tranh'] },
                { label: 'Phương thức', key: 'methodology', options: ['Một giai đoạn một túi hồ sơ', 'Một giai đoạn hai túi hồ sơ'] },
                { label: 'Quy trình', key: 'process', options: ['Quy trình chuẩn (Qua mạng)', 'Quy trình chuẩn (Trực tiếp)', 'Quy trình rút gọn'] },
                { label: 'Hợp đồng', key: 'contract', options: ['Trọn gói', 'Đơn giá cố định', 'Theo thời gian'] },
              ].map(field => (
                <div key={field.key} className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-400">{field.label}</span>
                  <div className="relative">
                    <select 
                      value={packageInfo[field.key]} 
                      onChange={e => setPackageInfo({...packageInfo, [field.key]: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none transition-all"
                    >
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>

      {/* CENTER: CHAT */}
      <main className="flex-1 flex flex-col bg-white relative z-20 shadow-2xl overflow-hidden md:border-r border-slate-200 w-full">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-100 shrink-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
             <button onClick={() => setShowLeftSidebar(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
               <Menu size={20} />
             </button>
             <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Bot size={22} /></div>
             <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">{APP_CONFIG.botName}</h2>
                <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 mt-0.5"><CircleDot size={10} className="animate-pulse" /> Trực tuyến</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => lastAnalysisResult && setShowReport(true)}
              className={`hidden md:flex px-4 py-2 text-sm font-semibold rounded-xl transition-all items-center gap-2 ${lastAnalysisResult ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md' : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'}`}
            >
              <FileText size={16}/> Xem Báo Cáo
            </button>
            <button 
              onClick={() => lastAnalysisResult && setShowReport(true)}
              className={`md:hidden p-2 rounded-lg transition-all ${lastAnalysisResult ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
            >
              <FileText size={20}/>
            </button>
            <button onClick={() => setShowRightSidebar(true)} className="md:hidden p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Info size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6 custom-scrollbar">
           {messages.map((msg, i) => (
             <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'}`}>
                  {msg.role === 'assistant' ? <Bot size={18} /> : <UserIcon size={18} />}
                </div>
                <div className={`flex flex-col space-y-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-2xl shadow-sm relative group text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                      {msg.role === 'assistant' && i !== 0 && (
                        <button 
                          onClick={() => copyToClipboard(msg.content, i)}
                          className="absolute -right-10 top-2 p-2 bg-white border border-slate-200 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:text-blue-600 hover:border-blue-200 shadow-sm"
                          title="Sao chép"
                        >
                          {copiedIndex === i ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                      )}
                      {msg.attachment && (
                        <div className="mb-3 p-2.5 bg-black/10 rounded-xl flex items-center gap-3 w-max max-w-full">
                          {msg.attachment.type.startsWith('image/') ? (
                            <img src={msg.attachment.url} alt="file" className="w-12 h-12 object-cover rounded-lg border border-white/20" />
                          ) : (
                            <div className="w-12 h-12 bg-white/20 text-white rounded-lg flex items-center justify-center"><FileIcon size={20} /></div>
                          )}
                          <div className="overflow-hidden pr-2">
                            <p className="text-xs font-semibold truncate text-white max-w-[180px]">{msg.attachment.name}</p>
                          </div>
                        </div>
                      )}
                      <MarkdownRenderer content={msg.content} />
                  </div>
                  {msg.role === 'assistant' && msg.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-2">
                       {msg.suggestions.map((q, idx) => (
                         <button 
                           key={idx} 
                           onClick={() => handleSendMessage(q)}
                           className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm flex items-center gap-1.5"
                         >
                            <Sparkles size={12} className="text-blue-500" /> {q}
                         </button>
                       ))}
                    </div>
                  )}
                </div>
             </div>
           ))}
           {isAnalyzing && (
             <div className="flex items-start gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm"><Bot size={18} /></div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-slate-500">Playbot đang xử lý...</span>
                </div>
             </div>
           )}
           <div ref={chatEndRef} />
        </div>

        <div className="p-3 md:p-4 border-t border-slate-200 bg-white shrink-0">
          <div className="relative max-w-4xl mx-auto flex flex-col gap-3">
            {attachment && (
              <div className="flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-100 rounded-xl w-max animate-in fade-in zoom-in-95 duration-200">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  {attachment.mimeType.startsWith('image/') ? <ImageIcon size={20}/> : <FileIcon size={20} />}
                </div>
                <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="p-1.5 hover:bg-blue-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors ml-1"><X size={16} /></button>
              </div>
            )}
            
            {chatSuggestedLaws.length > 0 && (
              <div className="flex flex-col gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5"><Sparkles size={14}/> VBPL Đề xuất cho câu hỏi này:</span>
                  <button onClick={() => setChatSuggestedLaws([])} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chatSuggestedLaws.map((law, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white border border-blue-200 px-2.5 py-1.5 rounded-lg text-xs shadow-sm group">
                      <span className="font-medium text-slate-700 truncate max-w-[200px]" title={law.reason}>{law.title}</span>
                      <button onClick={() => handleAddSuggestedLaw(law)} className="text-blue-600 hover:text-blue-800 p-0.5 rounded-md hover:bg-blue-50 opacity-50 group-hover:opacity-100 transition-opacity" title="Thêm vào thư viện"><Plus size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0"><Paperclip size={22} /></button>
              <button 
                onClick={handleSuggestChatLaws}
                disabled={isSuggestingChatLaws || (!inputMessage.trim() && !attachment)}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="AI Gợi ý VBPL liên quan"
              >
                {isSuggestingChatLaws ? <Loader2 size={22} className="animate-spin"/> : <BookOpen size={22} />}
              </button>
              <textarea 
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                placeholder="Hỏi về pháp luật đấu thầu..." 
                className="w-full py-3 bg-transparent outline-none text-sm min-h-[44px] max-h-[120px] resize-none font-medium text-slate-800 placeholder:text-slate-400" 
                rows={1}
              />
              <button 
                onClick={() => handleSendMessage()} 
                disabled={isAnalyzing || (!inputMessage.trim() && !attachment)}
                className={`p-3 rounded-xl transition-all shrink-0 ${isAnalyzing || (!inputMessage.trim() && !attachment) ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95'}`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT: PACKAGE DETAILS & ANALYZE */}
      {showRightSidebar && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setShowRightSidebar(false)} />
      )}
      <aside className={`absolute md:relative inset-y-0 right-0 transform ${showRightSidebar ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out w-80 bg-white p-6 flex flex-col shrink-0 z-50 md:z-30 shadow-2xl md:shadow-none border-l border-slate-200`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart3 size={18} className="text-blue-600"/> Thông tin dự án</h3>
          <button onClick={() => setShowRightSidebar(false)} className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên gói thầu</label>
            <textarea 
              value={packageInfo.name} 
              onChange={e => setPackageInfo({...packageInfo, name: e.target.value})}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white h-24 resize-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá (Tỷ VNĐ)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={packageInfo.value} onChange={e => setPackageInfo({...packageInfo, value: e.target.value})} className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hạn định</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input placeholder="VD: 360 ngày" className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                </div>
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nguồn vốn</label>
            <div className="relative">
              <select 
                value={packageInfo.source} 
                onChange={e => setPackageInfo({...packageInfo, source: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all"
              >
                <option value="Ngân sách nhà nước">Ngân sách nhà nước</option>
                <option value="Vốn ODA và vốn vay ưu đãi">Vốn ODA và vốn vay ưu đãi</option>
                <option value="Vốn tự có của doanh nghiệp">Vốn tự có của doanh nghiệp</option>
                <option value="Vốn vay thương mại">Vốn vay thương mại</option>
                <option value="Vốn hỗn hợp">Vốn hỗn hợp</option>
                <option value="Nguồn thu hợp pháp khác">Nguồn thu hợp pháp khác</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            <div className="flex items-center gap-2 mb-3 text-blue-700">
              <ShieldCheck size={18}/>
              <span className="text-sm font-bold">Kiểm soát rủi ro</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">Hệ thống AI sẽ tự động rà soát các lỗi thường gặp trong HSMT như: tiêu chí cài cắm, hạn mức chỉ định thầu, năng lực kinh nghiệm không phù hợp...</p>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><BookOpen size={14} className="text-blue-600"/> Gợi ý VBPL áp dụng</h4>
              <button onClick={handleSuggestLaws} disabled={isSuggestingLaws} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50">
                {isSuggestingLaws ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Tự động gợi ý
              </button>
            </div>
            {suggestedLaws.length > 0 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                {suggestedLaws.map((law, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-700 leading-snug">{law.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">{law.reason}</p>
                      </div>
                      <button
                        onClick={() => handleAddSuggestedLaw(law)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shrink-0 shadow-sm"
                        title="Thêm vào thư viện"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => handleSendMessage(null, true)}
          disabled={isGeneratingReport || isAnalyzing}
          className="mt-6 w-full p-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGeneratingReport ? <Loader2 size={18} className="animate-spin" /> : <GitBranch size={18} />}
          PHÂN TÍCH DỰ ÁN
        </button>
      </aside>

      {/* REPORT MODAL */}
      {showReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-6">
          <div className="bg-slate-100 w-full max-w-5xl h-[95vh] md:h-[90vh] rounded-2xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
             <header className="px-4 md:px-8 py-4 md:py-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className="p-2 md:p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100"><FileText size={20} className="md:w-[22px] md:h-[22px]"/></div>
                   <div>
                      <h3 className="font-bold text-slate-900 text-base md:text-lg leading-tight">Báo cáo Pháp lý</h3>
                      <p className="hidden md:block text-xs font-medium text-slate-500 mt-1">Xuất file chuẩn Nghị định 30/2020/NĐ-CP</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                   <button 
                    onClick={handleDownloadPDF} 
                    disabled={isDownloading || isGeneratingReport}
                    className="px-3 md:px-6 py-2 md:py-2.5 bg-blue-600 text-white text-xs md:text-sm font-semibold rounded-xl shadow-md hover:bg-blue-700 flex items-center gap-1.5 md:gap-2 disabled:opacity-50 transition-all"
                   >
                     {isDownloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} 
                     <span className="hidden md:inline">Tải PDF (A4)</span>
                     <span className="md:hidden">Tải PDF</span>
                   </button>
                   <button onClick={() => setShowReport(false)} className="p-2 md:p-2.5 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-200"><X size={18} className="md:w-[20px] md:h-[20px]"/></button>
                </div>
             </header>

             <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200/50 flex justify-center custom-scrollbar">
                <div id="report-paper" className="bg-white w-full md:w-[210mm] min-h-[297mm] shadow-xl p-6 md:p-[2cm] relative overflow-hidden flex flex-col rounded-sm" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                   {/* HEADER 30/2020 */}
                   <div className="flex justify-between items-start mb-10 text-[12pt] uppercase">
                      <div className="text-center">
                         <div className="font-bold text-[11pt]">{setupInfo.orgName.normalize('NFC')}</div>
                         <div className="font-bold border-b border-black pb-1 mb-1 text-[11pt]">{setupInfo.departmentName.normalize('NFC')}</div>
                         <div className="text-[10pt] font-normal normal-case mt-2">Số: ...../BC-PC</div>
                      </div>
                      <div className="text-center font-bold">
                         <div className="text-[11pt]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                         <div className="text-[11pt]">Độc lập - Tự do - Hạnh phúc</div>
                         <div className="w-32 h-[1px] bg-black mx-auto mt-1.5"></div>
                         <div className="mt-4 text-[11pt] font-normal normal-case italic">Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
                      </div>
                   </div>

                   {/* TITLE */}
                   <div className="text-center mb-10">
                      <h2 className="font-bold text-[15pt] leading-tight uppercase mb-2">BÁO CÁO PHÁP LÝ</h2>
                      <p className="font-bold text-[13pt] italic">V/v: Rà soát và đề xuất phương án đấu thầu cho dự án {packageInfo.name.normalize('NFC')}</p>
                   </div>

                   {/* CONTENT */}
                   <div className="flex-1">
                      {isGeneratingReport ? (
                         <div className="flex flex-col items-center justify-center h-64 gap-5">
                            <Loader2 size={48} className="animate-spin text-blue-600" />
                            <p className="text-slate-500 font-medium animate-pulse text-base">Hệ thống đang biên soạn nội dung báo cáo chi tiết...</p>
                         </div>
                      ) : (
                         <MarkdownRenderer content={lastAnalysisResult} isReport={true} />
                      )}
                   </div>

                   {/* FOOTER */}
                   <div className="mt-16 flex justify-between">
                      <div className="w-1/2">
                         <div className="font-bold italic text-[11pt] mb-1">Nơi nhận:</div>
                         <div className="text-[11pt]">- Ban Tổng Giám đốc (để b/c);</div>
                         <div className="text-[11pt]">- Lưu: VT, PC.</div>
                      </div>
                      <div className="w-1/2 text-center">
                         <div className="font-bold uppercase text-[11pt]">Người báo cáo</div>
                         <div className="mt-24 font-bold text-[11pt]">{APP_CONFIG.botName}</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ADD LAW MODAL */}
      {showAddLawModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-slate-900 text-lg">Thêm văn bản pháp lý</h4>
                <button onClick={() => setShowAddLawModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><X size={20}/></button>
             </div>
             <div className="space-y-5">
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Loại văn bản</label>
                   <select 
                    value={newLawInput.category}
                    onChange={e => setNewLawInput({...newLawInput, category: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                   >
                     <option>Luật</option>
                     <option>Nghị định</option>
                     <option>Thông tư</option>
                     <option>Văn bản hợp nhất</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tên / Số hiệu văn bản</label>
                   <input 
                    placeholder="VD: Nghị định 24/2024/NĐ-CP" 
                    value={newLawInput.title}
                    onChange={e => setNewLawInput({...newLawInput, title: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                   />
                </div>
                <button 
                  onClick={handleAddLaw}
                  className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-all mt-2 text-sm"
                >
                  Cập nhật vào tri thức AI
                </button>
             </div>
          </div>
        </div>
      )}

      {/* SCROLL BAR STYLES */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.5); }
      `}</style>

    </div>
  );
}
