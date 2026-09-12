import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  Plus,
  Check,
  ExternalLink,
  Info
} from 'lucide-react';
import { LineAttachment } from '../../types';

interface LineAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  attachments: LineAttachment[];
  onSaveAttachments: (attachments: LineAttachment[]) => void;
}

export const LineAttachmentsModal: React.FC<LineAttachmentsModalProps> = ({
  isOpen,
  onClose,
  itemName,
  attachments,
  onSaveAttachments
}) => {
  const [items, setItems] = useState<LineAttachment[]>(attachments || []);
  const [linkInput, setLinkInput] = useState('');
  const [linkNameInput, setLinkNameInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened
  React.useEffect(() => {
    setItems(attachments || []);
  }, [attachments, isOpen]);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newAttachment: LineAttachment = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          size: file.size,
          type: file.type,
          data: dataUrl,
          uploadedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };
        setItems(prev => [...prev, newAttachment]);
      };
      // Read as data URL for persistence and preview
      reader.readAsDataURL(file);
    });
  };

  const handleAddExternalLink = () => {
    if (!linkInput.trim()) return;
    const newAttachment: LineAttachment = {
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: linkNameInput.trim() || 'رابط تصميم خارجي (Drive / Cloud)',
      data: linkInput.trim(),
      type: 'link',
      uploadedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };
    setItems(prev => [...prev, newAttachment]);
    setLinkInput('');
    setLinkNameInput('');
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(att => att.id !== id));
  };

  const handleSaveAndClose = () => {
    onSaveAttachments(items);
    onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileBadge = (name: string, type?: string) => {
    if (type === 'link') {
      return { label: 'رابط', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
    }
    const ext = name.split('.').pop()?.toUpperCase() || '';
    if (ext === 'PDF') return { label: 'PDF', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    if (ext === 'AI') return { label: 'AI', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
    if (ext === 'PSD') return { label: 'PSD', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
    if (ext === 'EPS') return { label: 'EPS', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
    if (ext === 'SVG') return { label: 'SVG', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (ext === 'CDR') return { label: 'CDR', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext)) return { label: ext, bg: 'bg-teal-100 text-teal-800 border-teal-300' };
    if (['ZIP', 'RAR'].includes(ext)) return { label: ext, bg: 'bg-amber-100 text-amber-900 border-amber-300' };
    return { label: ext || 'ملف', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl text-amber-300">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>مرفقات البند والتصاميم</span>
                <span className="text-xs bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full">
                  {items.length} مرفق
                </span>
              </h2>
              <p className="text-xs text-blue-200 truncate max-w-md">
                الصنف: <strong className="text-white">{itemName || 'بند الفاتورة'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl text-blue-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-slate-50/50">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.pdf,.ai,.psd,.eps,.svg,.cdr,.tif,.tiff,.zip,.rar"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-800 text-sm">
                انقر لاختيار ملفات أو اسحب وأفلت ملفات الطباعة والتصاميم هنا
              </div>
              <div className="text-xs text-slate-600 font-medium">
                الصيغ المعتمدة لأعمال الطباعة حسب إعدادات النظام:
              </div>
              {/* Badges for Supported Print Formats */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">PDF</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-teal-100 text-teal-800 border border-teal-300">JPG</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">PNG</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-orange-100 text-orange-900 border border-orange-300">AI (Illustrator)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">PSD (Photoshop)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">EPS</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">SVG</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-300">CDR / وغيرها</span>
              </div>
            </div>
          </div>

          {/* External Link Section */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              <span>أو أضف رابط سحابي خارجي (Google Drive, WeTransfer, Dropbox)</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={linkNameInput}
                onChange={(e) => setLinkNameInput(e.target.value)}
                placeholder="عنوان الملف / الوصف (اختياري)"
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 sm:w-1/3 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="الصق الرابط هنا https://..."
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 flex-1 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddExternalLink}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة رابط</span>
              </button>
            </div>
          </div>

          {/* Attachments List */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>المرفقات المرفوعة ({items.length})</span>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-red-500 hover:text-red-700 text-[11px] font-semibold cursor-pointer"
                >
                  حذف الكل
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                لا توجد مرفقات مرفوعة لهذا البند حتى الآن.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((att) => {
                  const isImage = att.type?.startsWith('image/') || att.data?.startsWith('data:image/');
                  const isLink = att.type === 'link';
                  const badge = getFileBadge(att.name, att.type);

                  return (
                    <div
                      key={att.id}
                      className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                        {isImage && att.data ? (
                          <img
                            src={att.data}
                            alt={att.name}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                        ) : isLink ? (
                          <div className="w-11 h-11 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                            <ExternalLink className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}

                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded border shrink-0 ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                              {att.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {att.size && <span>{formatFileSize(att.size)}</span>}
                            {att.uploadedAt && <span>{att.uploadedAt}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {att.data && (
                          <a
                            href={att.data}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={!isLink ? att.name : undefined}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="فتح / تحميل"
                          >
                            {isLink ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(att.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="حذف المرفق"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500" />
            <span>يتم ربط المرفقات مباشرة بهذا البند وحفظها مع الفاتورة وطلب الطباعة</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>تأكيد وحفظ المرفقات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
