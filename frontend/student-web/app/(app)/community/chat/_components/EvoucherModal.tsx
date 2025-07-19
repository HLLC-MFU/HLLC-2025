import React, { useState } from 'react';

interface EvoucherModalProps {
  roomId: string;
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface EvoucherFormData {
  title: string;
  description: string;
  claimUrl: string;
}

const EvoucherModal = ({ roomId, isVisible, onClose, onSuccess }: EvoucherModalProps) => {
  const [formData, setFormData] = useState<EvoucherFormData>({
    title: '',
    description: '',
    claimUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<EvoucherFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<EvoucherFormData> = {};
    if (!formData.title.trim()) newErrors.title = 'กรุณากรอกชื่อ evoucher';
    if (!formData.description.trim()) newErrors.description = 'กรุณากรอกรายละเอียด evoucher';
    if (!formData.claimUrl.trim()) {
      newErrors.claimUrl = 'กรุณากรอก URL สำหรับรับ evoucher';
    } else if (!/^https?:\/\//.test(formData.claimUrl)) {
      newErrors.claimUrl = 'กรุณากรอก URL ที่ถูกต้อง';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // TODO: Replace with real API call
      await new Promise((res) => setTimeout(res, 1000));
      window.alert('ส่ง evoucher เรียบร้อยแล้ว');
      onClose();
      onSuccess?.();
      setFormData({ title: '', description: '', claimUrl: '' });
      setErrors({});
    } catch (error) {
      window.alert('เกิดข้อผิดพลาดในการส่ง evoucher');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
    setFormData({ title: '', description: '', claimUrl: '' });
    setErrors({});
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="backdrop-blur-md bg-slate-800/90 rounded-2xl p-6 w-[350px] flex flex-col items-center shadow-xl relative">
        {/* Header */}
        <div className="flex flex-row items-center justify-between w-full mb-4">
          <div className="flex flex-row items-center gap-2">
            <span className="text-2xl">🎁</span>
            <span className="text-lg font-bold text-white">ส่ง E-Voucher</span>
          </div>
          <button onClick={handleClose} className="text-white text-xl px-2 py-1 rounded hover:bg-white/10" disabled={loading}>
            ×
          </button>
        </div>
        {/* Info Banner */}
        <div className="flex flex-row items-center bg-blue-900/20 rounded-lg p-3 mb-4 w-full">
          <span className="text-blue-400 mr-2">ℹ️</span>
          <span className="text-white text-sm">ส่ง E-Voucher ให้กับสมาชิกในห้องนี้</span>
        </div>
        {/* Form Fields */}
        <form className="flex flex-col gap-4 w-full" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div className="flex flex-col gap-1">
            <label className="text-white text-sm font-semibold">ชื่อ E-Voucher *</label>
            <input
              className={`bg-white/10 rounded-lg px-4 py-2 text-white border ${errors.title ? 'border-red-500' : 'border-white/20'}`}
              placeholder="เช่น ส่วนลด 50% สำหรับร้านอาหาร"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={loading}
            />
            {errors.title && <span className="text-red-400 text-xs mt-1">{errors.title}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-white text-sm font-semibold">รายละเอียด *</label>
            <textarea
              className={`bg-white/10 rounded-lg px-4 py-2 text-white border ${errors.description ? 'border-red-500' : 'border-white/20'}`}
              placeholder="อธิบายรายละเอียดของ E-Voucher"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              disabled={loading}
            />
            {errors.description && <span className="text-red-400 text-xs mt-1">{errors.description}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-white text-sm font-semibold">URL สำหรับรับ E-Voucher *</label>
            <input
              className={`bg-white/10 rounded-lg px-4 py-2 text-white border ${errors.claimUrl ? 'border-red-500' : 'border-white/20'}`}
              placeholder="https://example.com/claim"
              value={formData.claimUrl}
              onChange={e => setFormData(prev => ({ ...prev, claimUrl: e.target.value }))}
              disabled={loading}
              type="url"
            />
            {errors.claimUrl && <span className="text-red-400 text-xs mt-1">{errors.claimUrl}</span>}
          </div>
          {/* Footer */}
          <div className="flex flex-row gap-3 mt-2 w-full">
            <button type="button" className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-white border border-white/20 hover:bg-white/20" onClick={handleClose} disabled={loading}>
              ยกเลิก
            </button>
            <button type="submit" className={`flex-1 bg-blue-500 rounded-lg px-4 py-2 text-white font-semibold hover:bg-blue-600 ${loading ? 'opacity-60' : ''}`} disabled={loading}>
              {loading ? 'กำลังส่ง...' : 'ส่ง E-Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvoucherModal; 