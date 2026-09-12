import React, { useState, useRef } from 'react';
import { LineAttachment, InvoiceItem } from '../../types';
import {
  X,
  Download,
  FileText,
  Upload,
  ShieldCheck,
  FileCheck,
  Eye,
  Trash2,
  AlertCircle,
  File,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { posSound } from '../../utils/audio';

interface WorkshopAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  item: InvoiceItem | null;
  itemIndex: number;
  currentUserName: string;
  onAddAttachment: (itemIndex: number, attachment: LineAttachment) => void;
  onRemoveAttachment: (itemIndex: number, attachmentId: string) => { success: boolean; message?: string };
}

export const WorkshopAttachmentModal: React.FC<WorkshopAttachmentModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
  item,
  itemIndex,
  currentUserName,
  onAddAttachment,
  onRemoveAttachment
}) => {
  const [selectedPreview, setSelectedPreview] = useState<LineAttachment | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !item) return null;

  const attachments: LineAttachment[] = item.attachments || [];

  // Active preview defaults to the first attachment if available
  const activeAttachment = selectedPreview || (attachments.length > 0 ? attachments[0] : null);

  const handleDownload = (att: LineAttachment) => {
    posSound.click();
    if (att.data) {
      const link = document.createElement('a');
      link.href = att.data;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create a dummy text/file blob for simulation if data URL is not embedded
      const sampleBlob = new Blob([`ملف أمر طباعة رقم: ${invoiceNumber}\nاسم الصنف: ${item.itemName}\nاسم الملف: ${att.name}\nتاريخ الرفع: ${att.uploadedAt || 'غير محدد'}\nبواسطة: ${att.uploadedBy || 'المستخدم'}`], {
        type: att.type || 'text/plain;charset=utf-8'
      });
      const url = URL.createObjectURL(sampleBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const now = new Date();
      const newAtt: LineAttachment = {
        id: 'att-rev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: file.name,
        size: file.size,
        type: file.type,
        data: dataUrl,
        uploadedAt: now.toLocaleDateString('ar-EG') + ' ' + now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }),
        isOriginal: false, // نسخة معدلة وليست أصلية
        uploadedBy: currentUserName || 'فني الورشة'
      };

      onAddAttachment(itemIndex, newAtt);
      setSelectedPreview(newAtt);
      posSound.beep();
      setFeedbackMsg({
        type: 'success',
        text: `تم إرفاق النسخة المعدلة "${file.name}" بنجاح`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    };

    // If file is large or binary, read as data URL
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (att: LineAttachment) => {
    // Check if original attachment: strictly forbidden to delete!
    if (att.isOriginal) {
      posSound.error();
      setFeedbackMsg({
        type: 'error',
        text: 'محظور: لا يمكن حذف المرفقات الأصلية المعتمدة للفاتورة!'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    const res = onRemoveAttachment(itemIndex, att.id);
    if (res.success) {
      posSound.click();
      setFeedbackMsg({
        type: 'success',
        text: 'تم حذف النسخة المعدلة'
      });
      if (selectedPreview?.id === att.id) {
        setSelectedPreview(null);
      }
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      posSound.error();
      setFeedbackMsg({
        type: 'error',
        text: res.message || 'فشل حذف المرفق'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'غير محدد';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">إدارة وتنزيل ملفات البند</h3>
                <span className="bg-blue-900/80 text-blue-200 border border-blue-700/60 text-xs px-2 py-0.5 rounded font-mono font-semibold">
                  فاتورة {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-lg">
                الصنف: <strong className="text-slate-200">{item.itemName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Attachment List & Upload */}
          <div className="md:col-span-5 space-y-4 flex flex-col">
            {/* Upload revised attachment trigger */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                id="revised-file-input"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="revised-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  إعادة إرفاق / رفع ملف معدل
                </span>
                <span className="text-[11px] text-slate-500">
                  (بروفة جديدة، تصحيح قياسات، أو تعديل تصميم)
                </span>
              </label>
            </div>

            {/* List of Attachments */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  قائمة المرفقات ({attachments.length}):
                </span>
                <span className="text-[11px] text-slate-500">
                  انقر على الملف للمعاينة والتنزيل
                </span>
              </div>

              {attachments.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs">لا توجد ملفات مرفقة بهذا البند حالياً</p>
                  <p className="text-[11px] mt-1 text-slate-500">يمكنك رفع بروفة أو نسخة معدلة من الزر أعلاه</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                  {attachments.map((att) => {
                    const isSelected = activeAttachment?.id === att.id;
                    const isOriginal = att.isOriginal !== false;

                    return (
                      <div
                        key={att.id}
                        onClick={() => setSelectedPreview(att)}
                        className={`p-2.5 rounded-lg border text-right cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div
                              className={`w-7 h-7 rounded shrink-0 flex items-center justify-center text-xs ${
                                isOriginal ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <File className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                                {att.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {formatFileSize(att.size)} • {att.uploadedAt || 'تاريخ غير محدد'}
                              </p>
                            </div>
                          </div>

                          {/* Original vs Revised Badge */}
                          {isOriginal ? (
                            <span
                              className="shrink-0 text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                              title="مرفق أصلي محمي من الحذف"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>أصلي محمي</span>
                            </span>
                          ) : (
                            <span
                              className="shrink-0 text-[9px] bg-sky-100 text-sky-900 border border-sky-300 font-bold px-1.5 py-0.5 rounded"
                              title="نسخة معدلة / بروفة"
                            >
                              معدل
                            </span>
                          )}
                        </div>

                        {/* Uploader and Action Row */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 truncate max-w-[170px]">
                            بواسطة: {att.uploadedBy || 'المستخدم'}
                          </span>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleDownload(att)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="تنزيل الملف"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* DELETE BUTTON: STRICTLY DISALLOWED for original attachments */}
                            {isOriginal ? (
                              <span
                                className="text-slate-300 p-1 cursor-not-allowed"
                                title="لا يمكن حذف المرفقات الأصلية المعتمدة"
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDelete(att)}
                                className="p-1 text-rose-500 hover:bg-rose-100 rounded transition-colors"
                                title="حذف النسخة المعدلة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active File Preview & Actions */}
          <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-500" />
                <span>معاينة وتفاصيل الملف</span>
              </span>

              {activeAttachment && (
                <button
                  type="button"
                  onClick={() => handleDownload(activeAttachment)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الملف المرفق</span>
                </button>
              )}
            </div>

            {activeAttachment ? (
              <div className="flex-1 flex flex-col justify-between pt-4 space-y-4">
                {/* Visual View Area */}
                <div className="flex-1 min-h-[220px] bg-white border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-center overflow-hidden">
                  {activeAttachment.data && activeAttachment.data.startsWith('data:image') ? (
                    <img
                      src={activeAttachment.data}
                      alt={activeAttachment.name}
                      className="max-h-[240px] w-auto object-contain rounded shadow-xs"
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 break-all max-w-sm px-2">
                        {activeAttachment.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {activeAttachment.type || 'ملف رقمي'} • {formatFileSize(activeAttachment.size)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">نوع المستند:</span>
                    <strong className="text-slate-800 font-mono">
                      {activeAttachment.type || 'غير مصنف'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">حالة المرفق:</span>
                    {activeAttachment.isOriginal !== false ? (
                      <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>مرفق أصلي محمي (لا يمكن حذفه)</span>
                      </span>
                    ) : (
                      <span className="text-blue-800 bg-blue-100 px-2 py-0.5 rounded font-bold text-[11px]">
                        نسخة معدلة / بروفة فنية
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">تاريخ ووقت الرفع:</span>
                    <span className="text-slate-700 font-mono">{activeAttachment.uploadedAt || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">اسم رافع الملف:</span>
                    <strong className="text-slate-800">{activeAttachment.uploadedBy || 'المستخدم'}</strong>
                  </div>
                </div>

                {/* Bottom Notice on Protection */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>سياسة حفظ الملفات الأصلية:</strong> المرفقات الأصلية المعتمدة لا يمكن حذفها نهائياً لضمان سلامة الأرشيف، بينما يحق للفني إضافة نسخ معدلة ومتابعة تطور التصاميم.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <FileText className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm font-semibold">لم يتم تحديد أي ملف للمعاينة</p>
                <p className="text-xs text-slate-400 mt-1">اختر ملفاً من القائمة الجانبية أو قم برفع نسخة معدلة جديدة</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            الصنف: <strong className="text-slate-800">{item.itemName}</strong> ({item.quantity} {item.unit || 'قطعة'})
          </span>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
