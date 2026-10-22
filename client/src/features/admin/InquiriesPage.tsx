import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, MessageCircle, Search, Trash2, Inbox, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { PageToolbar, SectionCard, TableWrap, Td, Th } from './ui';
import { useSite } from '../site/SiteContext';
import { normalizePhone, waLink } from '../../lib/wa';
import { INQUIRY_STATUS_BADGE, INQUIRY_STATUS_LABEL, formatDate } from '../../lib/labels';
import type { Inquiry, Pagination as Pag } from '../../lib/types';

const STATUSES = ['BARU', 'DIPROSES', 'SELESAI', 'BATAL'] as const;

export default function InquiriesPage() {
  const qc = useQueryClient();
  const { settings } = useSite();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Inquiry | null>(null);
  const [note, setNote] = useState('');
  const [deleting, setDeleting] = useState<Inquiry | null>(null);

  const qs = new URLSearchParams({ page: String(page), limit: '15' });
  if (status) qs.set('status', status);
  if (search) qs.set('q', search);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-inquiries', qs.toString()],
    queryFn: async () => {
      const res = await api.get(`/admin/inquiries?${qs}`);
      return res.data.data as { inquiries: (Inquiry & { itemCount: number })[]; pagination: Pag };
    },
    placeholderData: (prev) => prev,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-inquiries'] });

  const openDetail = async (id: string) => {
    try {
      const res = await api.get(`/admin/inquiries/${id}`);
      const inq = res.data.data.inquiry as Inquiry;
      setDetail(inq);
      setNote(inq.internalNote || '');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const saveStatus = useMutation({
    mutationFn: async (payload: { id: string; status?: string; internalNote?: string }) =>
      api.put('/admin/inquiries', payload),
    onSuccess: () => {
      toast.success('Inquiry diperbarui.');
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/inquiries/${id}`),
    onSuccess: () => {
      toast.success('Inquiry dihapus.');
      setDeleting(null);
      setDetail(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const replyWa = (inq: Inquiry) => {
    const lines = (inq.items || [])
      .map((it, i) => `${i + 1}. ${it.productName} x${it.qty}`)
      .join('\n');
    const msg = `Halo ${inq.name || 'Kak'}, terima kasih sudah mengirim permintaan penawaran ${inq.code} 🙏\n\nBerikut produk yang diminta:\n${lines}\n\nBerikut penawaran resmi dari kami. Silakan ditanyakan bila ada yang perlu diklarifikasi.`;
    const phone = normalizePhone(inq.whatsapp || '');
    window.open(
      phone ? waLink(phone, msg) : waLink(settings.whatsapp, msg),
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || 'Gagal memuat inquiry.'}
        action={
          <button type="button" className="btn-outline" onClick={() => refetch()}>
            Coba Lagi
          </button>
        }
      />
    );
  }

  const counts = {
    semua: data?.pagination.total || 0,
  };

  return (
    <div>
      <PageToolbar>
        <p className="text-sm text-muted">
          Daftar permintaan penawaran dari keranjang penawaran pengunjung situs.
        </p>
        <a
          href={`/api/admin/inquiries/export/csv${status ? `?status=${status}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
          onClick={(e) => {
            // gunakan fetch agar ikut membawa cookie sesi
            e.preventDefault();
            void (async () => {
              try {
                const res = await fetch(`/api/admin/inquiries/export/csv${status ? `?status=${status}` : ''}`, {
                  credentials: 'include',
                });
                if (!res.ok) throw new Error('Gagal mengunduh CSV');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'inquiries.csv';
                a.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                toast.error(errorMessage(err));
              }
            })();
          }}
        >
          <Download className="h-4 w-4" />
          Ekspor CSV
        </a>
      </PageToolbar>

      {/* Filter status */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setPage(1);
            }}
            className={`chip border px-3 py-1.5 ${!status ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-muted'}`}
          >
            Semua ({counts.semua})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`chip border px-3 py-1.5 ${status === s ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-muted'}`}
            >
              {INQUIRY_STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <form
          role="search"
          className="relative w-full sm:w-64"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
            setPage(1);
          }}
        >
          <label htmlFor="inq-search" className="sr-only">
            Cari inquiry
          </label>
          <input
            id="inq-search"
            className="input pr-10"
            placeholder="Cari kode, nama, kota…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary" aria-label="Cari">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <SectionCard>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : data && data.inquiries.length > 0 ? (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Pelanggan</Th>
                  <Th className="text-center">Item</Th>
                  <Th>Tanggal</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {data.inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-surface/60">
                    <Td className="font-mono text-xs font-semibold">{inq.code}</Td>
                    <Td>
                      <p className="font-medium">{inq.name || 'Tanpa nama'}</p>
                      <p className="text-xs text-muted">
                        {inq.city && `${inq.city} · `}
                        {inq.whatsapp || inq.email || 'Tanpa kontak'}
                      </p>
                    </Td>
                    <Td className="text-center">
                      <span className="chip bg-surface text-muted">{inq.itemCount} produk</span>
                    </Td>
                    <Td className="text-sm text-muted">{formatDate(inq.createdAt)}</Td>
                    <Td className="text-center">
                      <span className={`chip border ${INQUIRY_STATUS_BADGE[inq.status] || ''}`}>
                        {INQUIRY_STATUS_LABEL[inq.status] || inq.status}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                          onClick={() => openDetail(inq.id)}
                          title="Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted hover:bg-emerald-50 hover:text-emerald-600"
                          onClick={() => replyWa(inq)}
                          title="Balas via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                          onClick={() => setDeleting(inq)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={page} totalPages={data.pagination.totalPages} onChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={<Inbox className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada inquiry"
            message="Permintaan penawaran dari pengunjung situs akan muncul di sini."
          />
        )}
      </SectionCard>

      {/* ===== Detail ===== */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        wide
        title={`Detail Inquiry ${detail?.code || ''}`}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button type="button" className="btn-ghost text-primary" onClick={() => detail && setDeleting(detail)}>
              <Trash2 className="h-4 w-4" /> Hapus
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn-ghost" onClick={() => setDetail(null)}>
                <X className="h-4 w-4" /> Tutup
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => detail && saveStatus.mutate({ id: detail.id, status: detail.status, internalNote: note })}
                disabled={saveStatus.isPending}
              >
                {saveStatus.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-card bg-surface p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted">Nama</p>
                <p className="font-medium text-ink">{detail.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Kota</p>
                <p className="font-medium text-ink">{detail.city || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">WhatsApp</p>
                <p className="font-medium text-ink">{detail.whatsapp || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Email</p>
                <p className="font-medium text-ink">{detail.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Tanggal masuk</p>
                <p className="font-medium text-ink">{formatDate(detail.createdAt, { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Sumber</p>
                <p className="font-medium text-ink">{detail.source}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-ink">Produk yang Diminta</h3>
              <div className="overflow-hidden rounded-card border border-gray-100">
                <table className="w-full text-sm">
                  <tbody>
                    {detail.items.map((it, i) => (
                      <tr key={it.id} className={i % 2 ? 'bg-white' : 'bg-surface/60'}>
                        <td className="border-b border-gray-100 px-4 py-2.5">
                          {it.productSlug ? (
                            <a href={`/produk/${it.productSlug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-ink hover:text-primary">
                              {it.productName}
                            </a>
                          ) : (
                            <span className="font-medium text-ink">{it.productName}</span>
                          )}
                        </td>
                        <td className="border-b border-gray-100 px-4 py-2.5 text-right font-semibold text-primary">
                          {it.qty} unit
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="inq-status">
                Status
              </label>
              <select
                id="inq-status"
                className="input"
                value={detail.status}
                onChange={(e) => setDetail({ ...detail, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {INQUIRY_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="inq-note">
                Catatan internal (tidak tampil ke publik)
              </label>
              <textarea
                id="inq-note"
                className="input min-h-[90px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="misal: sudah dikirim harga via WA, menunggu PO…"
              />
            </div>

            <button type="button" className="btn-primary w-full" onClick={() => replyWa(detail)}>
              <MessageCircle className="h-4 w-4" /> Balas via WhatsApp
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus inquiry?"
        message={`Inquiry ${deleting?.code || ''} beserta seluruh itemnya akan dihapus permanen.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
