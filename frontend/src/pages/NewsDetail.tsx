import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MessageCircle, Send, User } from 'lucide-react';
import { useArticle, useArticles } from '../hooks/useContent';
import { postComment } from '../services/site/content.service';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/api';
import { formatDate, formatFullDate } from '../lib/dates';
import { Comment } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ArticleCard from '../components/ui/ArticleCard';
import Rail from '../components/ui/Rail';
import SectionHeader from '../components/ui/SectionHeader';
import ShareButtons from '../components/ui/ShareButtons';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { article, loading } = useArticle(id);
  const { data: allArticles } = useArticles({ limit: 20 });
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setZoomed(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [zoomed]);

  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentError, setCommentError] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setComments(article?.comments ?? []);
  }, [article]);

  if (loading && !article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite">
        <LoadingSpinner />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-extrabold uppercase text-white">Article introuvable</h1>
          <Link to="/news" className="btn-yellow">Retour aux actualités</Link>
        </div>
      </div>
    );
  }

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComment.trim()) return;

    setPosting(true);
    setCommentError('');
    try {
      const saved = await postComment(String(article.id), {
        author: user?.name || 'Supporter',
        content: newComment.trim(),
      });
      setComments((current) => [...current, saved]);
      setNewComment('');
    } catch (cause) {
      setCommentError(
        cause instanceof ApiError ? cause.fullMessage : 'Commentaire non enregistré.'
      );
    } finally {
      setPosting(false);
    }
  };

  const related = allArticles
    .filter((item) => String(item.id) !== String(article.id))
    .slice(0, 6);

  return (
    <div className="bg-graphite">
      <section className={`page-hero min-h-[420px] bg-graphite ${article.image ? 'page-hero--image page-hero--soft' : ''}`}>
        {article.image && <img src={article.image} alt="" className="absolute inset-0 h-full w-full object-cover" style={article.imagePosition ? { objectPosition: article.imagePosition } : undefined} />}
        <div className="site-container relative z-20 pb-12 pt-32">
          <Link
            to="/news"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold uppercase text-white/70 transition-colors hover:text-club-yellow"
          >
            <ArrowLeft size={16} />
            Retour aux actualités
          </Link>
          <p className="page-hero__kicker text-shadow-hero">{article.category}</p>
          <h1 className="page-hero__title text-shadow-hero max-w-4xl">{article.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <Calendar size={15} className="text-club-yellow" />
              {formatFullDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-2">
              <User size={15} className="text-club-yellow" />
              {article.author}
            </span>
          </div>
        </div>
      </section>

      <article className="band-charcoal py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {article.image && (
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="group mb-10 block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-black/40"
              aria-label="Agrandir la photo"
            >
              <img
                src={article.image}
                alt={article.title}
                className="mx-auto max-h-[75vh] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </button>
          )}

          <p className="border-l-2 border-club-yellow pl-5 text-lg font-medium leading-relaxed text-white/90 md:text-xl">
            {article.excerpt}
          </p>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-white/75">
            {article.content.split('\n').filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 border-t border-white/10 pt-6">
            <ShareButtons title={article.title} label="Partager cet article" />
          </div>
        </div>
      </article>

      <section className="band-graphite py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-extrabold uppercase text-white">
            <MessageCircle size={24} className="text-club-yellow" />
            Commentaires ({comments.length})
          </h2>

          <form onSubmit={handleCommentSubmit} className="panel mb-10 p-5">
            <label htmlFor="comment" className="sr-only">Votre commentaire</label>
            <textarea
              id="comment"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Laissez un commentaire…"
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-club-yellow"
            />
            {commentError && <p className="mt-2 text-sm text-red-400">{commentError}</p>}
            <button
              type="submit"
              disabled={!newComment.trim() || posting}
              className="btn-yellow mt-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
              {posting ? 'Envoi…' : 'Publier'}
            </button>
          </form>

          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={String(comment.id)} className="panel p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold uppercase text-club-yellow">{comment.author}</span>
                    <span className="text-xs text-white/40">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/75">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-white/50">
              Aucun commentaire pour le moment. Soyez le premier à réagir.
            </p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="band-green py-8">
          <div className="site-container">
            <SectionHeader title="À lire aussi" linkLabel="Toutes les actualités" linkTo="/news" className="mb-8" />
            <Rail>
              {related.map((item) => (
                <ArticleCard
                  key={String(item.id)}
                  to={`/news/${item.id}`}
                  image={item.image}
                  imagePosition={item.imagePosition}
                  kicker={item.category}
                  title={item.title}
                  date={item.publishedAt}
                />
              ))}
            </Rail>
          </div>
        </section>
      )}

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/95 p-4"
        >
          <img src={article.image} alt={article.title} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            className="absolute right-5 top-5 text-3xl leading-none text-white/80 hover:text-white"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsDetail;
