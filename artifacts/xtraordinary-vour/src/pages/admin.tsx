import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@workspace/replit-auth-web';
import {
  getGetAdminSiteContentQueryKey,
  getGetCmsAdminAccessQueryKey,
  getGetPublicSiteContentQueryKey,
  useGetAdminSiteContent,
  useGetCmsAdminAccess,
  useRequestUploadUrl,
  useUpdateAdminSiteContent,
  type SiteContent,
  type SiteMember,
} from '@workspace/api-client-react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CloudUpload,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import './admin.css';
import { useLocation } from 'wouter';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

type MemberFieldProps = {
  member: SiteMember;
  index: number;
  form: UseFormReturn<SiteContent>;
  uploading: boolean;
  uploadError: string | null;
  onUpload: (event: ChangeEvent<HTMLInputElement>, memberIndex: number) => void;
};

function MemberEditor({ member, index, form, uploading, uploadError, onUpload }: MemberFieldProps) {
  const inputId = `cms-member-image-${member.id}`;
  const fileRef = useRef<HTMLInputElement>(null);
  const imageUrl = form.watch(`members.${index}.imageUrl`);

  return (
    <article className="cms-member-card" data-testid={`card-member-${member.id}`}>
      <div className="cms-member-top">
        <h3 data-testid={`text-member-name-${member.id}`}>{member.name || `Anggota ${index + 1}`}</h3>
        <span className="cms-member-index">XOV / 0{index + 1}</span>
      </div>
      <div className="cms-member-body">
        <div className="cms-fields">
          <FormField
            control={form.control}
            name={`members.${index}.name`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Nama tampilan</FormLabel>
                <FormControl><Input {...field} className="cms-input" placeholder="Nama anggota" data-testid={`input-member-name-${member.id}`} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`members.${index}.alias`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Alias</FormLabel>
                <FormControl><Input {...field} className="cms-input" placeholder="Nama alias kreator" data-testid={`input-member-alias-${member.id}`} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`members.${index}.description`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Deskripsi singkat</FormLabel>
                <FormControl><Textarea {...field} className="cms-textarea" placeholder="Tulis satu atau dua kalimat tentang kreator ini" data-testid={`input-member-description-${member.id}`} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`members.${index}.channel`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Tautan kanal</FormLabel>
                <FormControl><Input {...field} className="cms-input" type="url" placeholder="https://" data-testid={`input-member-channel-${member.id}`} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`members.${index}.imageUrl`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Gambar anggota</FormLabel>
                <div className="cms-image-row">
                  <div className="cms-image-preview" data-testid={`preview-member-image-${member.id}`}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={`Pratinjau gambar ${member.name}`} />
                    ) : (
                      <div className="cms-image-placeholder"><div><CloudUpload aria-hidden="true" /><br />Belum ada gambar</div></div>
                    )}
                  </div>
                  <div className="cms-image-controls">
                    <input
                      ref={fileRef}
                      id={inputId}
                      className="cms-file-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label={`Unggah gambar untuk ${member.name}`}
                      data-testid={`input-member-image-file-${member.id}`}
                      onChange={(event) => onUpload(event, index)}
                    />
                    <button
                      className="cms-upload-button"
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      data-testid={`button-upload-member-image-${member.id}`}
                    >
                      {uploading ? <LoaderCircle className="cms-spin" aria-hidden="true" /> : <CloudUpload aria-hidden="true" />}
                      {uploading ? 'Mengunggah…' : 'Unggah gambar'}
                    </button>
                    <p className="cms-field-help">PNG, JPEG, atau WebP · maksimal 10 MB</p>
                    {uploadError && <p className="cms-inline-error" role="alert" data-testid={`error-upload-member-image-${member.id}`}>{uploadError}</p>}
                  </div>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="cms-input"
                    type="text"
                    placeholder="Atau tempel URL gambar"
                    aria-label={`URL gambar ${member.name}`}
                    data-testid={`input-member-image-url-${member.id}`}
                  />
                </FormControl>
                <p className="cms-field-help">Unggahan akan mengganti tautan ini. URL gambar tetap disimpan di layanan asal.</p>
              </FormItem>
            )}
          />
        </div>
      </div>
    </article>
  );
}

function CmsSkeleton() {
  return (
    <div className="cms-page">
      <header className="cms-topbar"><div className="cms-brand"><span className="cms-brand-mark">XV</span><span className="cms-brand-name">XTRA ORDINARY<small className="cms-brand-caption">VOUR / CREATOR COLLECTIVE</small></span></div></header>
      <main className="cms-main" aria-label="Memuat editor situs" data-testid="status-content-loading">
        <div className="cms-skeleton cms-skeleton-line" style={{ width: 210, height: 10, marginBottom: 20 }} />
        <div className="cms-skeleton cms-skeleton-line" style={{ width: 'min(560px, 80%)', height: 54, marginBottom: 30 }} />
        <div className="cms-loading-grid">
          {[0, 1, 2, 3].map((item) => (
            <div className="cms-skeleton-card" key={item}>
              <div className="cms-skeleton cms-skeleton-line" style={{ width: '56%' }} />
              <div className="cms-skeleton cms-skeleton-line" style={{ width: '100%', height: 38, marginTop: 24 }} />
              <div className="cms-skeleton cms-skeleton-line" style={{ width: '100%', height: 38, marginTop: 18 }} />
              <div className="cms-skeleton cms-skeleton-line" style={{ width: '100%', height: 70, marginTop: 18 }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatusScreen({
  kind,
  title,
  copy,
  action,
  actionLabel,
  secondaryAction,
  secondaryLabel,
}: {
  kind: 'login' | 'denied' | 'error';
  title: string;
  copy: string;
  action: () => void;
  actionLabel: string;
  secondaryAction?: () => void;
  secondaryLabel?: string;
}) {
  const Icon = kind === 'login' ? LockKeyhole : kind === 'denied' ? ShieldCheck : AlertCircle;
  return (
    <div className="cms-page">
      <header className="cms-topbar">
        <div className="cms-brand"><span className="cms-brand-mark">XV</span><span><span className="cms-brand-name">XTRA ORDINARY</span><small className="cms-brand-caption">VOUR / CREATOR COLLECTIVE</small></span></div>
        <a className="cms-text-button" href="/" data-testid="link-back-to-site"><ArrowLeft aria-hidden="true" /> Situs publik</a>
      </header>
      <main className="cms-main">
        <section className="cms-status-card" aria-labelledby="cms-status-title">
          <div className="cms-status-icon"><Icon aria-hidden="true" /></div>
          <p className="cms-eyebrow">XOV / EDITOR SITUS</p>
          <h1 id="cms-status-title" data-testid={`heading-${kind}`}>{title}</h1>
          <p data-testid={`text-${kind}-message`}>{copy}</p>
          <div className="cms-status-actions">
            <button className="cms-primary-action" type="button" onClick={action} data-testid={`button-${kind}-action`}>{actionLabel}</button>
            {secondaryAction && secondaryLabel && (
              <button className="cms-text-button" type="button" onClick={secondaryAction} data-testid={`button-${kind}-secondary`}>{secondaryLabel}</button>
            )}
          </div>
          <small className="cms-status-meta">Empat kreator · satu ruang bersama</small>
        </section>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading, isAuthenticated, login, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const accessQuery = useGetCmsAdminAccess({
    query: { enabled: isAuthenticated, queryKey: getCmsAdminAccessQueryKey(), retry: false },
  });

  const isAuthorized = isAuthenticated && accessQuery.data?.authorized === true;
  const contentQuery = useGetAdminSiteContent({
    query: { enabled: isAuthorized, queryKey: getAdminSiteContentQueryKey(), retry: false },
  });

  const updateContent = useUpdateAdminSiteContent();
  const requestUploadUrl = useRequestUploadUrl();
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<SiteContent>({
    defaultValues: contentQuery.data ?? {
      members: [
        { id: '1', name: 'Azelyth Faeren', alias: 'Ren/Eren', description: '', channelUrl: 'https://youtube.com/@zelren1475', imageUrl: '' },
        { id: '2', name: 'Riyuzi Vynae', alias: 'Riyu', description: '', channelUrl: 'https://youtube.com/Priyuzivynae751', imageUrl: '' },
        { id: '3', name: 'Azaa Lockwood', alias: 'Azaa', description: '', channelUrl: 'https://youtube.com/@azaalockwood', imageUrl: '' },
        { id: '4', name: 'Shezi Asta Freola', alias: 'Frell', description: '', channelUrl: 'https://youtube.com/@ramrr_frell', imageUrl: '' },
      ],
      theme: { base: '#100E14', violet: '#BD67FF', magenta: '#FF4F9A' },
    },
  });

  const serverContent = contentQuery.data;
  useEffect(() => {
    if (serverContent?.members?.length && !form.formState.isDirty) {
      form.reset(serverContent);
    }
  }, [serverContent, form]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, memberIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const member = form.getValues(`members.${memberIndex}`);
    setUploadErrors((current) => ({ ...current, [member.id]: '' }));
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadErrors((current) => ({ ...current, [member.id]: 'Pilih gambar PNG, JPEG, atau WebP.' }));
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadErrors((current) => ({ ...current, [member.id]: 'Ukuran gambar melebihi batas 10 MB.' }));
      event.target.value = '';
      return;
    }

    setUploadingMemberId(member.id);
    setSaveError(null);
    try {
      const upload = await requestUploadUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type as 'image/png' | 'image/jpeg' | 'image/webp' },
      });
      const response = await fetch(upload.uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) throw new Error('Gambar tidak dapat diunggah. Silakan coba lagi.');
      form.setValue(`members.${memberIndex}.imageUrl`, `/api/storage${upload.objectPath}`, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    } catch (error) {
        const saveChanges = async (data: SiteContent) => {
    setSaveMessage(null);
    setSaveError(null);
    try {
      const saved = await updateContent.mutateAsync({ data });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCmsAdminAccessQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getAdminSiteContentQueryKey() }),
      ]);
      form.reset(saved);
      setSaveMessage('Perubahan situs berhasil diterbitkan.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Perubahan tidak dapat disimpan. Silakan coba lagi.');
    }
  };
  if (authLoading) return <CmsSkeleton />;
  // if (!isAuthenticated) {
  //   return <StatusScreen kind="login" title="Masuk untuk mengedit." copy="Editor ini khusus untuk pemilik situs XOV. Masuk untuk memeriksa akses akun Anda." action={() => window.location.href = '#/admin'} actionLabel="Masuk" />;
  // }
  if (accessQuery.isLoading) return <CmsSkeleton />;
  if (accessQuery.isError) {
    return <StatusScreen kind="error" title="Akses tidak dapat diperiksa." copy="Izin edit belum dapat dikonfirmasi. Coba periksa kembali; perubahan Anda tetap aman." action={() => void accessQuery.refetch()} actionLabel="Coba lagi" secondaryAction={logout} secondaryLabel="Keluar" />;
  }
  // if (!accessQuery.data?.authorized) {
  //  return <StatusScreen kind="denied" title="Ruang ini khusus admin." copy="Akun Anda berhasil masuk, tetapi tidak memiliki izin untuk mengedit situs publik XOV." action={logout} actionLabel="Keluar" secondaryAction={() => setLocation('/')} secondaryLabel="Kembali ke situs" />;
  // }
  if (contentQuery.isError) {
    return <StatusScreen kind="error" title="Konten gagal dimuat." copy="Editor tidak dapat mengambil konten situs saat ini. Silakan muat ulang konten." action={() => void contentQuery.refetch()} actionLabel="Muat ulang konten" secondaryAction={logout} secondaryLabel="Keluar" />;
  }
  // if (contentQuery.isLoading || !contentQuery.data) return <CmsSkeleton />;

  const members = form.watch('members');
  const theme = form.watch('theme');
  const isDirty = form.formState.isDirty;
  const displayName = user?.firstName || 'Admin XOV';
  const initials = displayName.slice(0, 1).toUpperCase();
  const themeFields = [
    { name: 'theme.base' as const, label: 'Dasar', token: 'Latar situs' },
    { name: 'theme.violet' as const, label: 'Ungu', token: 'Aksen utama' },
    { name: 'theme.magenta' as const, label: 'Magenta', token: 'Aksen kedua' },
  ];

  return (
    <div className="cms-page">
      <header className="cms-topbar">
        <div className="cms-brand">
          <span className="cms-brand-mark">XV</span>
          <span><span className="cms-brand-name">XTRA ORDINARY</span><small className="cms-brand-caption">VOUR / CREATOR COLLECTIVE</small></span>
        </div>
        <div className="cms-header-actions">
          <div className="cms-user" data-testid="text-current-user">
            <span className="cms-user-initial" aria-hidden="true">{initials}</span>
            <span>{displayName}</span>
          </div>
          <button className="cms-text-button" type="button" onClick={logout} data-testid="button-sign-out"><LogOut aria-hidden="true" /> Keluar</button>
        </div>
      </header>
      <main className="cms-main">
        <div className="cms-heading">
          <div>
            <p className="cms-eyebrow">XOV / EDITOR SITUS / 01</p>
            <h1>Atur situs <em>Anda.</em></h1>
            <p className="cms-heading-copy">Perbarui profil empat kreator dan warna situs. Perubahan akan tampil di situs publik setelah disimpan.</p>
          </div>
          <div className={`cms-publish-state ${isDirty ? 'is-dirty' : 'is-saved'}`} data-testid="status-save-state">
            {isDirty ? 'PERUBAHAN BELUM DISIMPAN' : 'SEMUA PERUBAHAN TERSIMPAN'}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(saveChanges)} data-testid="form-admin-content">
            <div className="cms-workspace">
              <section className="cms-content" aria-labelledby="cms-members-title">
                <div className="cms-section-heading">
                  <h2 id="cms-members-title">Profil anggota</h2>
                  <span data-testid="text-member-count">{String(members?.length ?? 0).padStart(2, '0')} / 4 ANGGOTA</span>
                </div>
                <div className="cms-members">
                  {members?.map((member: SiteMember, index: number) => (
                    <MemberEditor
                      key={member.id}
                      member={member}
                      index={index}
                      form={form}
                      uploading={uploadingMemberId === member.id}
                      uploadError={uploadErrors[member.id] || null}
                      onUpload={handleUpload}
                    />
                  ))}
                </div>
              </section>

              <aside className="cms-sidebar" aria-label="Tema situs dan pengaturan penerbitan">
                <section className="cms-side-panel" aria-labelledby="cms-theme-title">
                  <div className="cms-side-panel-head">
                    <h2 id="cms-theme-title"><Palette size={15} aria-hidden="true" /> Palet warna</h2>
                    <p>Tiga warna ini membentuk tampilan situs. Pilih warna atau masukkan kode hex.</p>
                  </div>
                  <div className="cms-theme-fields">
                    {themeFields.map((item) => (
                      <FormField
                        key={item.name}
                        control={form.control}
                        name={item.name}
                        render={({ field }) => (
                          <FormItem className="cms-theme-row">
                            <div><FormLabel className="cms-theme-name">{item.label}</FormLabel><span className="cms-theme-token">{item.token}</span></div>
                            <div className="cms-color-control">
                              <input
                                type="color"
                                className="cms-color-picker"
                                value={field.value}
                                onChange={field.onChange}
                                  aria-label={`Pemilih warna ${item.label}`}
                                  data-testid={`input-theme-${item.name.split('.')[1]}-picker`}
                              />
                              <FormControl>
                                <Input
                                  className="cms-color-hex"
                                  value={field.value}
                                  onChange={field.onChange}
                                  aria-label={`Kode hex ${item.label}`}
                                  maxLength={7}
                                  pattern="^#[0-9A-Fa-f]{6}$"
                                  data-testid={`input-theme-${item.name.split('.')[1]}-hex`}
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <div className="cms-theme-strip" aria-label="Pratinjau warna situs" data-testid="preview-theme-colors">
                    <span style={{ backgroundColor: theme.base }} />
                    <span style={{ backgroundColor: theme.violet }} />
                    <span style={{ backgroundColor: theme.magenta }} />
                  </div>
                </section>

                <section className="cms-side-panel cms-publish-panel" aria-labelledby="cms-publish-title">
                  <h2 id="cms-publish-title"><Sparkles size={15} aria-hidden="true" /> Terbitkan perubahan</h2>
                  <p>Simpan sekali untuk memperbarui profil anggota dan warna situs sekaligus.</p>
                  <button className="cms-save-button" type="submit" disabled={!isDirty || updateContent.isPending || Boolean(uploadingMemberId)} data-testid="button-save-content">
                    {updateContent.isPending ? <LoaderCircle aria-hidden="true" /> : saveMessage && !isDirty ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}
                    {updateContent.isPending ? 'Menyimpan…' : saveMessage && !isDirty ? 'Diterbitkan' : 'Simpan perubahan'}
                  </button>
                  {saveMessage && !isDirty && <p className="cms-save-notice" role="status" data-testid="status-save-success">{saveMessage}</p>}
                  {saveError && <p className="cms-save-error" role="alert" data-testid="status-save-error">{saveError}</p>}
                  <a className="cms-text-button" href="/" target="_blank" rel="noreferrer" style={{ width: '100%', marginTop: 10 }} data-testid="link-preview-site">
                    <ExternalLink aria-hidden="true" /> Pratinjau situs publik
                  </a>
                </section>
              </aside>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
