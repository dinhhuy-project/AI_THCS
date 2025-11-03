import React, { useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Message as MessageType } from '../types';
import { TypingIndicator } from './TypingIndicator';

interface MessageProps {
  message: MessageType;
}

// Define the KaTeX auto-render function on the window object for TypeScript
declare global {
  interface Window {
    katex: any;
    renderMathInElement: (element: HTMLElement, options?: any) => void;
  }
}

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const Message: React.FC<MessageProps> = ({ message }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isModel = message.role === 'model';

  // A more robust parser that handles math blocks and code blocks
  const parsedContent = useMemo(() => {
    if (!isModel) return message.content;

    // Regex to match both inline ($...$) and display ($$...$$) math
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    // Regex to match code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;

    // First, collect and protect code blocks
    const codeBlocks: string[] = [];
    let withProtectedCode = message.content.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match);
      return `⟦${codeBlocks.length - 1}⟧`;
    });

    // Split content by math expressions while preserving the delimiters
    const parts: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mathRegex.exec(withProtectedCode)) !== null) {
      // Add text before the math expression
      if (match.index > lastIndex) {
        parts.push(withProtectedCode.slice(lastIndex, match.index));
      }
      // Add the math expression
      parts.push(match[0]);
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text after last math expression
    if (lastIndex < withProtectedCode.length) {
      parts.push(withProtectedCode.slice(lastIndex));
    }

    // Process each part
    const processedParts = parts.map(part => {
      // If this is a math expression, return it unchanged
      if (part.startsWith('$')) {
        return part;
      }

      // For non-math parts:
      // 1. Restore code blocks
      let processed = part.replace(/⟦(\d+)⟧/g, (_, i) => codeBlocks[parseInt(i)]);
      
      // 2. Process text outside code blocks
      return processed.split(/(```[\s\S]*?```)/g).map((segment, i) => {
        if (i % 2 === 0) {
          // Not in code block - escape HTML and process markdown
          return escapeHtml(segment)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        } else {
          // In code block - return as is with syntax highlighting
          return `<pre><code>${segment.slice(3, -3)}</code></pre>`;
        }
      }).join('');
    });

    return processedParts.join('');
  }, [message.content, isModel]);

  // Use MutationObserver to watch for content changes and render math formulas
  useLayoutEffect(() => {
    if (!contentRef.current || !isModel || !window.katex || !window.renderMathInElement) {
      return;
    }

    const renderMath = () => {
      try {
        window.renderMathInElement(contentRef.current!, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false,
          output: 'html',
          strict: false,
          trust: true,
          macros: {
            "\\f": "f(#1)"
          }
        });
      } catch (error) {
        console.error("KaTeX rendering error:", error);
      }
    };

    // Create a MutationObserver to watch for content changes
    const observer = new MutationObserver((mutations) => {
      // Check if the mutations include changes to text content or child nodes
      const hasContentChanges = mutations.some(mutation => 
        mutation.type === 'characterData' || mutation.type === 'childList'
      );

      if (hasContentChanges) {
        // Use RAF to ensure DOM is fully updated
        requestAnimationFrame(() => {
          renderMath();
        });
      }
    });

    // Start observing the content element
    observer.observe(contentRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Initial render
    requestAnimationFrame(renderMath);

    return () => {
      observer.disconnect();
    };
  }, [message.content, isModel]);

  if (!message.content.trim() && isModel && !message.image) {
    return <TypingIndicator />;
  }

  const messageClasses = isModel
    ? 'bg-white text-gray-800 rounded-b-2xl rounded-tr-2xl border border-gray-200'
    : 'bg-amber-100 text-amber-900 rounded-b-2xl rounded-tl-2xl';
  
  const containerClasses = isModel ? 'justify-start' : 'justify-end';
  
  const avatar = isModel ? '🤖' : '🧑‍🎓';
  const avatarClasses = isModel ? 'mr-3 bg-teal-200' : 'ml-3 bg-amber-200 order-2';

  return (
    <div className={`flex items-end ${containerClasses}`}>
      {isModel && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${avatarClasses}`}>
          {avatar}
        </div>
      )}
      <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 shadow-lg ${messageClasses}`}>
        {!isModel && message.image && (
          <img src={message.image} alt="Nội dung đã gửi" className="rounded-lg mb-2 max-h-64 object-contain" />
        )}
        {isModel ? (
          <div 
            ref={contentRef} 
            dangerouslySetInnerHTML={{ __html: parsedContent }}
            className="prose prose-sm max-w-none whitespace-pre-wrap" 
          />
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {message.content}
          </div>
        )}
      </div>
      {!isModel && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${avatarClasses}`}>
          {avatar}
        </div>
      )}
    </div>
  );
};