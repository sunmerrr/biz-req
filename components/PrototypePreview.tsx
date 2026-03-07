interface PrototypePreviewProps {
  html: string;
}

function injectSafeNavigation(html: string): string {
  const baseTag = '<base target="_self">';
  const script = `<script>
// showPage fallback 제공
if (typeof showPage === 'undefined') {
  window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(function(p) { p.style.display = 'none'; });
    var target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
  };
}

document.addEventListener('click', function(e) {
  var anchor = e.target.closest('a');
  if (!anchor) return;
  var href = anchor.getAttribute('href');
  // 앵커 링크: .page 클래스 요소면 showPage() 자동 호출
  if (href && href.startsWith('#') && href.length > 1) {
    e.preventDefault();
    var targetId = href.substring(1);
    var targetEl = document.getElementById(targetId);
    if (targetEl && targetEl.classList.contains('page')) {
      showPage(targetId);
    } else if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }
  // onclick 핸들러가 있는 링크는 허용 (페이지 전환 등)
  if (anchor.hasAttribute('onclick')) return;
  // javascript: href 허용
  if (href && href.startsWith('javascript:')) return;
  e.preventDefault();
});
// onclick이 없고 실제 경로를 가진 링크만 비활성화
document.querySelectorAll('a').forEach(function(a) {
  var href = a.getAttribute('href');
  if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !a.hasAttribute('onclick')) {
    a.setAttribute('href', 'javascript:void(0)');
  }
});
</script>`;

  // Insert <base> into <head>, and script before </body>
  let result = html;
  if (result.includes('<head>')) {
    result = result.replace('<head>', '<head>' + baseTag);
  } else if (result.includes('<html>')) {
    result = result.replace('<html>', '<html><head>' + baseTag + '</head>');
  } else {
    result = baseTag + result;
  }

  if (result.includes('</body>')) {
    result = result.replace('</body>', script + '</body>');
  } else {
    result = result + script;
  }

  return result;
}

export default function PrototypePreview({ html }: PrototypePreviewProps) {
  return (
    <div className="w-full h-[70vh] border border-gray-200 rounded-lg overflow-hidden bg-white">
      <iframe
        srcDoc={injectSafeNavigation(html)}
        sandbox="allow-scripts"
        title="생성된 프로토타입"
        className="w-full h-full"
      />
    </div>
  );
}
