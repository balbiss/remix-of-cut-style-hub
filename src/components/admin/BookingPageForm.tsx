import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Image as ImageIcon, Video, Loader2, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function BookingPageForm() {
  const { toast } = useToast();
  const { tenant, refreshTenant } = useAuth();
  
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setHeroTitle((tenant as any).hero_title || '');
      setHeroSubtitle((tenant as any).hero_subtitle || '');
      setHeroImageUrl((tenant as any).hero_image_url || null);
      setHeroVideoUrl((tenant as any).hero_video_url || '');
      setGalleryImages((tenant as any).gallery_images || []);
    }
  }, [tenant]);

  const uploadImageToStorage = async (file: File, folder: string): Promise<string | null> => {
    if (!tenant?.id) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${tenant.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('booking-media')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      toast({
        title: 'Erro ao fazer upload',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('booking-media')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setHeroImageFile(file);
    
    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setHeroImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setIsUploading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede 5MB e foi ignorado.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setGalleryFiles(prev => [...prev, ...validFiles]);

    // Preview
    const previews: string[] = [];
    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previews.push(event.target?.result as string);
        if (previews.length === validFiles.length) {
          setGalleryImages(prev => [...prev, ...previews]);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!tenant?.id) return;

    setIsSaving(true);
    try {
      let finalHeroImageUrl = heroImageUrl;

      // Upload hero image if new file was selected
      if (heroImageFile) {
        const uploadedUrl = await uploadImageToStorage(heroImageFile, 'hero');
        if (uploadedUrl) {
          finalHeroImageUrl = uploadedUrl;
        }
      }

      // Upload gallery images if new files were selected
      const uploadedGalleryUrls: string[] = [];
      for (const file of galleryFiles) {
        const uploadedUrl = await uploadImageToStorage(file, 'gallery');
        if (uploadedUrl) {
          uploadedGalleryUrls.push(uploadedUrl);
        }
      }

      const finalGalleryImages = [...galleryImages.filter(url => !url.startsWith('data:')), ...uploadedGalleryUrls];

      // Update tenant record
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          hero_title: heroTitle || null,
          hero_subtitle: heroSubtitle || null,
          hero_image_url: finalHeroImageUrl,
          hero_video_url: heroVideoUrl || null,
          gallery_images: finalGalleryImages.length > 0 ? finalGalleryImages : null,
        })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      await refreshTenant();
      setHeroImageFile(null);
      setGalleryFiles([]);

      toast({
        title: 'Página atualizada!',
        description: 'As configurações da página de agendamento foram salvas com sucesso.',
      });
    } catch (error: any) {
      console.error('Error saving booking page:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const extractVideoId = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    
    // Limpar a URL
    const cleanUrl = url.trim();
    
    // YouTube - múltiplos formatos (ordem importa - mais específicos primeiro)
    const youtubePatterns = [
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, // youtube.com/embed/VIDEO_ID
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/, // youtube.com/v/VIDEO_ID
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/, // youtu.be/VIDEO_ID
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/, // youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/, // youtube.com/...?v=VIDEO_ID ou &v=VIDEO_ID
      /^([a-zA-Z0-9_-]{11})$/, // Apenas o ID (11 caracteres)
    ];
    
    for (const pattern of youtubePatterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }

    // Vimeo
    const vimeoPatterns = [
      /(?:player\.vimeo\.com\/video\/)(\d+)/, // player.vimeo.com/video/123456
      /(?:vimeo\.com\/)(\d+)/, // vimeo.com/123456
      /^(\d+)$/, // Apenas o ID numérico
    ];
    
    for (const pattern of vimeoPatterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      console.warn('Não foi possível extrair o ID do vídeo da URL:', url);
      return null;
    }

    // Detectar se é YouTube ou Vimeo
    const cleanUrl = url.trim().toLowerCase();
    const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || videoId.length === 11;
    const isVimeo = cleanUrl.includes('vimeo.com') || /^\d+$/.test(videoId);

    if (isYouTube && !isVimeo) {
      // YouTube embed com parâmetros para melhor experiência
      // Removendo rel=0 para evitar problemas com vídeos restritos
      return `https://www.youtube.com/embed/${videoId}?modestbranding=1&playsinline=1&enablejsapi=1`;
    }
    
    if (isVimeo) {
      // Vimeo embed
      return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&badge=0`;
    }

    console.warn('Tipo de vídeo não reconhecido:', url);
    return null;
  };

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Texto Principal</CardTitle>
          <CardDescription>
            Personalize o título e subtítulo da página de agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero-title">Título</Label>
            <Input
              id="hero-title"
              placeholder="Seu estilo, no seu tempo"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar o texto padrão
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-subtitle">Subtítulo</Label>
            <Textarea
              id="hero-subtitle"
              placeholder="Agende seu horário em segundos e chegue no estilo que você merece."
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar o texto padrão
            </p>
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Imagem Principal</CardTitle>
          <CardDescription>
            Adicione uma imagem de destaque na página de agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {heroImageUrl && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
              <img
                src={heroImageUrl}
                alt="Hero preview"
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setHeroImageUrl(null);
                  setHeroImageFile(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleHeroImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button variant="outline" asChild disabled={isUploading}>
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {heroImageUrl ? 'Alterar Imagem' : 'Adicionar Imagem'}
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">
            Recomendado: 1200x600px. Tamanho máximo: 5MB
          </p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Vídeo Principal</CardTitle>
          <CardDescription>
            Adicione um vídeo do YouTube ou Vimeo (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero-video">URL do Vídeo</Label>
            <Input
              id="hero-video"
              type="url"
              placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
              value={heroVideoUrl}
              onChange={(e) => setHeroVideoUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cole o link completo do YouTube ou Vimeo
            </p>
          </div>
          {heroVideoUrl && getVideoEmbedUrl(heroVideoUrl) && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-black">
              <iframe
                src={getVideoEmbedUrl(heroVideoUrl) || ''}
                className="w-full h-full absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                frameBorder="0"
                title="Preview do vídeo"
              />
            </div>
          )}
          {heroVideoUrl && !getVideoEmbedUrl(heroVideoUrl) && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                URL inválida. Por favor, use um link completo do YouTube ou Vimeo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Galeria de Imagens</CardTitle>
          <CardDescription>
            Adicione várias imagens para criar uma galeria visual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {galleryImages.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeGalleryImage(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button variant="outline" asChild disabled={isUploading}>
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Adicionar Imagens à Galeria
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">
            Você pode selecionar múltiplas imagens. Tamanho máximo por imagem: 5MB
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button
          variant="gold"
          size="lg"
          onClick={handleSave}
          disabled={isSaving || isUploading}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

