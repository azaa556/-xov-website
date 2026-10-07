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
        <h3 data-testid={`text-member-name-${member.id}`}>{member.name}</h3>
        <span className="cms-member-index">XOV / 0{index + 1}</span>
      </div>

      <div className="cms-member-body">
        <div className="cms-fields">
          <FormField
            control={form.control}
            name={`members.${index}.name`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Nama Tampilan</FormLabel>
                <FormControl>
                  <Input {...field} className="cms-input" placeholder="Nama tampilan..." />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`members.${index}.alias`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Alias</FormLabel>
                <FormControl>
                  <Input {...field} className="cms-input" placeholder="Alias..." />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`members.${index}.description`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Deskripsi Singkat</FormLabel>
                <FormControl>
                  <Textarea {...field} className="cms-textarea" placeholder="Deskripsi..." />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`members.${index}.channel`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Tautan Kanal</FormLabel>
                <FormControl>
                  <Input {...field} className="cms-input" type="url" placeholder="https://..." />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`members.${index}.imageUrl`}
            render={({ field }) => (
              <FormItem className="cms-field">
                <FormLabel className="cms-field-label">Gambar Anggota</FormLabel>
                <div className="cms-image-row">
                  <div className="cms-image-preview" data-testid={`preview-member-image-${member.id}`}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={`Pratinjau gambar ${member.name}`} />
                    ) : (
                      <div className="cms-image-placeholder">
                        <div><CloudUpload /></div>
                      </div>
                    )}
                  </div>

                  <div className="cms-image-controls">
                    <input
                      ref={fileRef}
                      id={inputId}
                      className="cms-file-input"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
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
                      {uploading ? <LoaderCircle className="cms-spin" /> : null}
                      {uploading ? 'Mengunggah...' : 'Unggah Gambar'}
                    </button>
                    <p className="cms-field-help">PNG, JPEG, atau WebP maks 10MB.</p>
                    {uploadError && <p className="cms-inline-error" role="alert">{uploadError}</p>}
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
                <p className="cms-field-help">Unggahan akan mengganti tautan gambar secara otomatis.</p>
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
      <header className="cms-topbar"><div className="cms-brand"><span className="cms-brand-mark">XOV</span></div></header>
      <main className="cms-main" aria-label="Memuat editor situs" data-testid="cms-loading">
        <div className="cms-skeleton cms-skeleton-line" style={{ width: '200px', height: '24px' }} />
        <div className="cms-skeleton cms-skeleton-line" style={{ width: '300px', height: '16px' }} />
        <div className="cms-loading-grid">
          {[0, 1, 2, 3].map((item) => (
            <div className="cms-skeleton-card" key={item}>
              <div className="cms-skeleton cms-skeleton-line" style={{ width: '40%' }} />
              <div className="cms-skeleton cms-skeleton-line" style={{ width: '80%' }} />
              <div className="cms-skeleton cms-skeleton-line" style={{ width: '60%' }} />
              <div className="cms-skeleton cms-skeleton-line" style={{ width: '100%' }} />
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
  action?: () => void;
  actionLabel?: string;
  secondaryAction?: () => void;
  secondaryLabel?: string;
}) {
  const Icon = kind === 'login' ? LockKeyhole : kind === 'denied' ? ShieldCheck : AlertCircle;
  return (
    <div className="cms-page">
      <header className="cms-topbar">
        <div className="cms-brand"><span className="cms-brand-mark">XOV</span></div>
        <a className="cms-text-button" href="/" data-testid="link-back-to-site"><ArrowLeft size={16} /> Kembali ke situs</a>
      </header>
      <main className="cms-main">
        <section className="cms-status-card" aria-labelledby="cms-status-heading">
          <div className="cms-status-icon"><Icon aria-hidden="true" /></div>
          <p className="cms-eyebrow">XOV / EDITOR SITUS</p>
          <h1 id="cms-status-title" data-testid={`heading-${kind}`}>{title}</h1>
          <p data-testid={`text-${kind}-message`}>{copy}</p>
          <div className="cms-status-actions">
            {action && actionLabel && (
              <button className="cms-primary-action" type="button" onClick={action}>{actionLabel}</button>
            )}
            {secondaryAction && secondaryLabel && (
              <button className="cms-text-button" type="button" onClick={secondaryAction}>{secondaryLabel}</button>
            )}
          </div>
          <small className="cms-status-meta">Enpat kreator • satu ruang</small>
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
    query: { enabled: isAuthenticated, queryKey: getGetCmsAdminAccessQueryKey() },
  });

  const isAuthorized = isAuthenticated && accessQuery.data?.authorized;
  const contentQuery = useGetAdminSiteContent({
    query: { enabled: isAuthorized, queryKey: getGetAdminSiteContentQueryKey() },
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
        { id: '1', name: 'Azelyth Faeren', alias: 'Ren/Eren', description: '', channel: '', imageUrl: '' },
        { id: '2', name: 'Riyuzi Vynae', alias: 'Riyu', description: '', channel: '', imageUrl: '' },
        { id: '3', name: 'Azaa Lockwood', alias: 'Azaa', description: '', channel: '', imageUrl: '' },
        { id: '4', name: 'Shezi Asta Freolia', alias: 'Frell', description: '', channel: '', imageUrl: '' },
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
      setUploadErrors((current) => ({ ...current, [member.id]: 'Ukuran gambar maksimal 10MB.' }));
      event.target.value = '';
      return;
    }

    setUploadingMemberId(member.id);
    setSaveError(null);
    try {
      const upload = await requestUploadUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type },
      });
      const response = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) throw new Error('Gambar tidak dapat diunggah. Silakan coba lagi.');
      form.setValue(`members.${memberIndex}.imageUrl`, `/api/storage/${upload.objectKey}`, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    } catch (error) {
      setUploadErrors((current) => ({
        ...current,
        [member.id]: error instanceof Error ? error.message : 'Gagal mengunggah gambar.',
      }));
    } finally {
      setUploadingMemberId(null);
      event.target.value = '';
    }
  };

  const saveChanges = async (data: SiteContent) => {
    setSaveMessage(null);
    setSaveError(null);
    try {
      const saved = await updateContent.mutateAsync({ data });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetCmsAdminAccessQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAdminSiteContentQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetPublicSiteContentQueryKey() }),
      ]);
      form.reset(saved);
      setSaveMessage('Perubahan situs berhasil diterbitkan.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Perubahan tidak dapat disimpan.');
    }
  };

  if (authLoading) return <CmsSkeleton />;
  if (!isAuthenticated) {
    return (
      <StatusScreen
        kind="login"
        title="Masuk untuk mengedit"
        copy="Area ini khusus untuk tim kreator XOV. Silakan masuk terlebih dahulu."
        action={() => login()}
        actionLabel="Masuk"
      />
    );
  }
  if (accessQuery.isLoading) return <CmsSkeleton />;
  if (accessQuery.isError) {
    return (
      <StatusScreen
        kind="error"
        title="Akses tidak dapat diperiksa"
        copy="Terjadi kesalahan saat memeriksa hak akses Anda."
        action={() => accessQuery.refetch()}
        actionLabel="Coba Lagi"
      />
    );
  }
  if (!accessQuery.data?.authorized) {
    return (
      <StatusScreen
        kind="denied"
        title="Ruang ini khusus admin"
        copy="Akun Anda belum terdaftar sebagai admin editor situs."
        action={() => logout()}
        actionLabel="Keluar"
      />
    );
  }
  if (contentQuery.isError) {
    return (
      <StatusScreen
        kind="error"
        title="Konten gagal dimuat"
        copy="Tidak dapat memuat data profil dan tema situs saat ini."
        action={() => contentQuery.refetch()}
        actionLabel="Coba Lagi"
      />
    );
  }
  if (contentQuery.isLoading || !contentQuery.data) return <CmsSkeleton />;

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
          <span><span className="cms-brand-name">XTRA ORDINARY</span> <small>VOUR</small></span>
        </div>
        <div className="cms-header-actions">
          <div className="cms-user" data-testid="text-current-user">
            <span className="cms-user-initial" aria-hidden="true">{initials}</span>
            <span>{displayName}</span>
          </div>
          <button className="cms-text-button" type="button" onClick={() => logout()}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </header>

      <main className="cms-main">
        <div className="cms-heading">
          <div>
            <p className="cms-eyebrow">XOV / EDITOR SITUS / 01</p>
            <h1>Atur situs <em>Anda.</em></h1>
            <p className="cms-heading-copy">Perbarui profil empat kreator dan nuansa warna situs dari satu dashboard.</p>
          </div>
          <div className={`cms-publish-state ${isDirty ? 'is-dirty' : 'is-clean'}`}>
            {isDirty ? 'PERUBAHAN BELUM DISIMPAN' : 'SEMUA PERUBAHAN TERPUBLIKASI'}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(saveChanges)} data-testid="form-cms-editor">
            <div className="cms-workspace">
              <section className="cms-content" aria-labelledby="cms-members-title">
                <div className="cms-section-heading">
                  <h2 id="cms-members-title">Profil anggota</h2>
                  <span data-testid="text-member-count">{String(members?.length ?? 0)} anggota</span>
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

              <aside className="cms-sidebar" aria-label="Tema situs dan tindakan">
                <section className="cms-side-panel" aria-labelledby="cms-theme-title">
                  <div className="cms-side-panel-head">
                    <h2 id="cms-theme-title"><Palette size={15} aria-hidden="true" /> Palet Warna</h2>
                    <p>Tiga warna ini membentuk tampilan situs. Pilih warna sesuai estetika kelompok.</p>
                  </div>

                  <div className="cms-theme-fields">
                    {themeFields.map((item) => (
                      <FormField
                        key={item.name}
                        control={form.control}
                        name={item.name}
                        render={({ field }) => (
                          <FormItem className="cms-theme-row">
                            <div className="cms-theme-name">
                              <FormLabel className="cms-theme-label">{item.label}</FormLabel>
                              <small>{item.token}</small>
                            </div>
                            <div className="cms-color-control">
                              <input
                                type="color"
                                className="cms-color-picker"
                                value={field.value}
                                onChange={field.onChange}
                                aria-label={`Pemilih warna ${item.label}`}
                                data-testid={`input-theme-${item.name}-picker`}
                              />
                              <FormControl>
                                <Input
                                  className="cms-color-hex"
                                  value={field.value}
                                  onChange={field.onChange}
                                  aria-label={`Kode hex ${item.label}`}
                                  maxLength={7}
                                  pattern="^#([0-9A-Fa-f]{6})$"
                                  data-testid={`input-theme-${item.name}-hex`}
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="cms-theme-strip" aria-label="Pratinjau cepat warna tema">
                    <span style={{ backgroundColor: theme.base }} />
                    <span style={{ backgroundColor: theme.violet }} />
                    <span style={{ backgroundColor: theme.magenta }} />
                  </div>
                </section>

                <section className="cms-side-panel cms-publish-panel" aria-labelledby="cms-publish-title">
                  <h2 id="cms-publish-title"><Sparkles size={15} aria-hidden="true" /> Terbitkan</h2>
                  <p>Simpan sekali untuk memperbarui profil anggota dan tema situs secara langsung.</p>
                  <button
                    className="cms-save-button"
                    type="submit"
                    disabled={updateContent.isPending || !isDirty}
                    data-testid="button-save-cms"
                  >
                    {updateContent.isPending ? <LoaderCircle className="cms-spin" /> : <Save size={16} />}
                    {updateContent.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>

                  {saveMessage && !isDirty && <p className="cms-save-note" role="status"><Check size={14} /> {saveMessage}</p>}
                  {saveError && <p className="cms-save-error" role="alert"><AlertCircle size={14} /> {saveError}</p>}

                  <a className="cms-text-button" href="/" target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" size={14} /> Pratinjau situs
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
