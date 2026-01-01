

import React, { useState, useEffect } from 'react';
import { X, Cpu, Image as ImageIcon, Video, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, CreditCard, Crown, QrCode, Copy, Sparkles, MessageCircle, Link } from 'lucide-react';
import { ModelSettings, ModelConfig, UserProfile } from '../types';
import { testConnection } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ModelSettings;
  onSettingsChange: (newSettings: ModelSettings) => void;
  userProfile: UserProfile;
  onActivateCDK: (cdk: string) => boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  userProfile,
  onActivateCDK
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'model'>('plan');
  const [activeModelType, setActiveModelType] = useState<'text' | 'image' | 'video'>('text');
  
  // Subscription State
  const [cdkInput, setCdkInput] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Clear confetti after animation
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (!isOpen) return null;

  const handleActivation = () => {
      const success = onActivateCDK(cdkInput);
      if (success) {
          setShowConfetti(true);
          setCdkInput('');
          // Play sound or other feedback here if needed
      } else {
          alert("无效的激活码 (Invalid CDK)");
      }
  };

  const copyUserId = () => {
      navigator.clipboard.writeText(userProfile.id);
      alert("用户ID已复制: " + userProfile.id + "\n加好友后请直接粘贴发送。");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      
      {/* Confetti Overlay */}
      {showConfetti && <ConfettiOverlay />}

      {/* QR Code Modal Overlay */}
      {showQrModal && (
          <div className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowQrModal(false)}>
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-slate-900">添加开发者微信</h3>
                  <div className="w-48 h-48 bg-slate-200 mx-auto rounded-xl flex items-center justify-center border-2 border-slate-100">
                      {/* Placeholder for QR Code */}
                      <QrCode className="w-24 h-24 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600">
                      备注<span className="font-bold text-indigo-600">【AniScript购买】</span><br/>
                      人工发货，提供 1对1 技术指导
                  </p>
                  <button 
                    onClick={copyUserId}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                      <Copy className="w-4 h-4" /> 复制我的用户ID
                  </button>
              </div>
          </div>
      )}

      <div className="bg-[#131418] border border-slate-800 w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-[#0b0c0f] border-r border-slate-800 flex flex-col p-6 gap-2">
            <h2 className="text-lg font-bold text-white mb-6 pl-2">用户设置中心</h2>
            
            <NavButton 
                active={activeTab === 'plan'} 
                onClick={() => setActiveTab('plan')} 
                icon={Crown} 
                label="订阅与授权" 
            />
            <NavButton 
                active={activeTab === 'model'} 
                onClick={() => setActiveTab('model')} 
                icon={Link} 
                label="模型连接配置" 
            />

            <div className="mt-auto pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {userProfile.name.substring(0,2)}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-bold text-white truncate">{userProfile.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">ID: {userProfile.id}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-[#131418] relative">
            
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white z-10">
                <X className="w-6 h-6" />
            </button>

            {/* Content: Subscription */}
            {activeTab === 'plan' && (
                <div className="flex-1 overflow-y-auto p-12 space-y-12 animate-in slide-in-from-right-4">
                    
                    {/* Top: Membership Card */}
                    <div className={`relative w-full h-48 rounded-3xl p-8 flex flex-col justify-between overflow-hidden shadow-2xl ${
                        userProfile.plan === 'pro' 
                        ? 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-amber-600 text-white' 
                        : 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 text-slate-200'
                    }`}>
                        {/* Abstract BG Pattern */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                    {userProfile.plan === 'pro' ? 'Pro 永久会员' : '体验版会员'}
                                    {userProfile.plan === 'pro' && <Crown className="w-6 h-6 fill-yellow-200 text-yellow-100" />}
                                </h3>
                                <p className="text-sm opacity-80 mt-1 font-medium">
                                    {userProfile.plan === 'pro' ? '尊贵的 AniScript 合伙人' : '当前功能受限，请升级以解锁全部算力'}
                                </p>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono">
                                v3.5.0
                            </div>
                        </div>

                        <div className="flex justify-between items-end relative z-10">
                            <div className="space-y-1">
                                <div className="text-xs uppercase tracking-wider opacity-70 font-bold">有效期至</div>
                                <div className="text-lg font-mono font-bold">
                                    {userProfile.plan === 'pro' ? 'PERMANENT / 永久有效' : userProfile.expireDate?.split('T')[0] || '2025-01-01'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs uppercase tracking-wider opacity-70 font-bold">剩余生成额度</div>
                                <div className="text-3xl font-black font-sans">{userProfile.plan === 'pro' ? '∞' : userProfile.credits}</div>
                            </div>
                        </div>
                    </div>

                    {/* Middle: CDK Activation */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">CDK 激活兑换</h4>
                        <div className="flex gap-4">
                            <input 
                                value={cdkInput}
                                onChange={(e) => setCdkInput(e.target.value)}
                                placeholder="输入激活码 (例如: ANI-VIP-XXXX)"
                                className="flex-1 bg-[#0b0c0f] border-2 border-slate-800 rounded-xl px-6 py-4 text-lg font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                            />
                            <button 
                                onClick={handleActivation}
                                className="px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95"
                            >
                                立即激活
                            </button>
                        </div>
                    </div>

                    {/* Bottom: Purchase Guide */}
                    <div className="bg-[#0b0c0f] border border-slate-800 rounded-2xl p-8 flex items-center justify-between">
                        <div>
                            <h4 className="text-lg font-bold text-white mb-2">获取更多算力或解锁永久版</h4>
                            <p className="text-sm text-slate-500 max-w-md">
                                解锁 Pro 版可使用：自定义提示词工程、4K 图像导出、无限制视频生成以及专属技术支持。
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowQrModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#05c160] hover:bg-[#04ad56] text-white font-bold rounded-xl transition-all shadow-lg"
                        >
                            <MessageCircle className="w-5 h-5" /> 联系开发者获取 CDK
                        </button>
                    </div>

                </div>
            )}

            {/* Content: Model Config */}
            {activeTab === 'model' && (
                <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-4">
                    {/* Tabs Header */}
                    <div className="flex border-b border-slate-800 bg-[#0b0c0f] px-6 pt-2">
                        {[
                            { id: 'text', label: '文本/逻辑', icon: Cpu },
                            { id: 'image', label: '图像生成', icon: ImageIcon },
                            { id: 'video', label: '视频生成', icon: Video },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveModelType(tab.id as any)}
                                className={`px-6 py-4 flex items-center gap-2 text-sm font-medium transition-all relative ${
                                    activeModelType === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {activeModelType === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Config Form */}
                    <div className="flex-1 overflow-y-auto p-12">
                        <ConfigForm 
                            config={settings[activeModelType]} 
                            onChange={(key, val) => onSettingsChange({
                                ...settings,
                                [activeModelType]: { ...settings[activeModelType], [key]: val }
                            })}
                            type={activeModelType}
                        />
                    </div>
                    
                    {/* Footer Save Area */}
                    <div className="p-6 border-t border-slate-800 bg-[#0b0c0f] flex justify-end">
                         <button onClick={onClose} className="px-8 py-2.5 bg-white text-black hover:bg-slate-200 rounded-lg font-bold transition-colors">
                            保存配置
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            active 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
            : 'text-slate-400 hover:bg-[#1a1c22] hover:text-white'
        }`}
    >
        <Icon className="w-5 h-5" />
        {label}
    </button>
);

const ConfigForm: React.FC<{ 
  config: ModelConfig; 
  onChange: (key: keyof ModelConfig, val: string) => void; 
  type: 'text' | 'image' | 'video' 
}> = ({ config, onChange, type }) => {
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTest = async () => {
      setTestStatus('testing');
      setErrorMessage('');
      try {
          await testConnection(config);
          setTestStatus('success');
      } catch (e: any) {
          setTestStatus('fail');
          let msg = e.message || "连接失败";
          if (e.message && e.message.includes("401")) msg = "认证失败 (401): 请检查 API Key";
          if (e.message && e.message.includes("404")) msg = "找不到路径/模型 (404): 请检查 Base URL 或模型名称";
          setErrorMessage(msg);
      }
  };

  const handleQuickBaseUrl = () => {
      onChange('baseUrl', 'https://api.wfei.site');
  };

  return (
      <div className="space-y-8 max-w-2xl mx-auto">
          {/* API Key */}
          <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  API Key
                  <span className="text-[10px] text-slate-600 font-normal normal-case">连接 LLM 的密钥</span>
              </label>
              <div className="relative group">
                  <input 
                      type={showKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => {
                          onChange('apiKey', e.target.value);
                          setTestStatus('idle'); 
                      }}
                      placeholder="sk-..."
                      className="w-full bg-[#1a1c22] border border-slate-700 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors shadow-inner"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
              </div>
          </div>

          {/* Base URL */}
          <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  Base URL (中转地址)
                  <button onClick={handleQuickBaseUrl} className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold">
                      一键填入推荐
                  </button>
              </label>
              <div className="relative">
                  <input 
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) => {
                        onChange('baseUrl', e.target.value);
                        setTestStatus('idle');
                    }}
                    placeholder="https://api.wfei.site"
                    className="w-full bg-[#1a1c22] border border-slate-700 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-mono transition-colors shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono border border-slate-700 px-2 py-1 rounded">
                     OPENAI FORMAT
                  </div>
              </div>
          </div>

          {/* Model Name */}
          <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">模型名称 (Model Name)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                    <input 
                        type="text"
                        value={config.model}
                        onChange={(e) => {
                            onChange('model', e.target.value);
                            setTestStatus('idle');
                        }}
                        placeholder="输入模型 ID..."
                        className="w-full bg-[#1a1c22] border border-slate-700 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors shadow-inner"
                    />
                </div>
                <select 
                    className="bg-[#0b0c0f] text-xs text-slate-300 rounded-xl px-4 outline-none border border-slate-700 w-40 hover:border-slate-500 transition-colors"
                    onChange={(e) => {
                        onChange('model', e.target.value);
                        setTestStatus('idle');
                    }}
                    value=""
                >
                    <option value="" disabled>快速选择...</option>
                    {type === 'text' && (
                        <>
                            <optgroup label="Google / Advanced">
                                <option value="gemini-2.5-pro-preview">gemini-2.5-pro-preview</option>
                                <option value="gemini-3-pro-preview">gemini-3-pro-preview</option>
                            </optgroup>
                            <optgroup label="OpenAI">
                                <option value="gpt-4o">gpt-4o</option>
                                <option value="gpt-4-turbo">gpt-4-turbo</option>
                            </optgroup>
                        </>
                    )}
                    {type === 'image' && (
                        <>
                            <optgroup label="Google">
                                <option value="gemini-2.5-flash-image">gemini-2.5-flash-image</option>
                                <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview</option>
                            </optgroup>
                            <optgroup label="DALL-E">
                                <option value="dall-e-3">dall-e-3</option>
                            </optgroup>
                        </>
                    )}
                    {type === 'video' && (
                        <>
                            <optgroup label="Google">
                                <option value="veo-3.1-fast-generate-preview">veo-3.1-fast-generate-preview</option>
                            </optgroup>
                            <optgroup label="Sora (Proxy)">
                                <option value="sora-2-all">sora-2-all</option>
                                <option value="sora-2">sora-2</option> 
                            </optgroup>
                        </>
                    )}
                </select>
              </div>
          </div>

          {/* Test Connection */}
          <div className="pt-6 border-t border-slate-800/50">
              <button 
                  onClick={handleTest}
                  disabled={testStatus === 'testing'}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold transition-all shadow-lg ${
                      testStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/50' :
                      testStatus === 'fail' ? 'bg-red-500/10 text-red-400 border border-red-500/50' :
                      'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/20'
                  }`}
              >
                  {testStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {testStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {testStatus === 'fail' && <AlertCircle className="w-4 h-4" />}
                  
                  {testStatus === 'idle' && "测试连接 (Test Connection)"}
                  {testStatus === 'testing' && "正在请求..."}
                  {testStatus === 'success' && "连接成功 (Connected)"}
                  {testStatus === 'fail' && "连接失败 (Failed)"}
              </button>
              
              {testStatus === 'fail' && errorMessage && (
                  <div className="mt-4 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-300 font-mono break-all animate-in slide-in-from-top-2">
                      Error: {errorMessage}
                  </div>
              )}
          </div>
      </div>
  );
};

const ConfettiOverlay = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex justify-center">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-in zoom-in duration-500">
                  <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-200 drop-shadow-2xl">
                      WELCOME PRO
                  </h1>
             </div>
             {/* Simple CSS particles can be added here, simplified for this snippet */}
        </div>
    );
};
