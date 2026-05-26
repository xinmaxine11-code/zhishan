async function loadPosts() {
  const feed = document.getElementById('feed');

  try {
    const res = await fetch('posts.json?t=' + Date.now());
    const data = await res.json();

    if (!data.posts || data.posts.length === 0) {
      feed.innerHTML = '<p class="empty-state">还没有内容。</p>';
      return;
    }

    data.posts.forEach(post => {
      const hasImages = post.images && post.images.length > 0;
      const hasContent = post.content && post.content.trim().length > 0;

      let classes = 'post';
      if (hasImages && !hasContent) classes += ' image-only';
      if (hasImages && hasContent) classes += ' has-images';

      const article = document.createElement('article');
      article.className = classes;

      let html = `<div class="post-meta">${formatDate(post.date)}</div>`;

      if (post.title && post.title.trim()) {
        html += `<h2 class="post-title">${escapeHtml(post.title)}</h2>`;
      }

      if (hasImages) {
        html += '<div class="post-images">';
        post.images.forEach(img => {
          html += `<img src="images/${escapeHtml(img)}" alt="" loading="lazy">`;
        });
        html += '</div>';
      }

      if (hasContent) {
        html += '<div class="post-content">';
        post.content.trim().split('\n\n').forEach(para => {
          if (para.trim()) {
            html += `<p>${escapeHtml(para.trim()).replace(/\n/g, '<br>')}</p>`;
          }
        });
        html += '</div>';
      }

      article.innerHTML = html;
      feed.appendChild(article);
    });

  } catch (e) {
    feed.innerHTML = '<p class="empty-state">加载失败，请检查 posts.json 文件。</p>';
    console.error(e);
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y} · ${m} · ${day}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

loadPosts();
