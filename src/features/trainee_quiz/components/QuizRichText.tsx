import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface QuizRichTextProps {
  content: string;
  className?: string;
}

const QuizRichText: React.FC<QuizRichTextProps> = ({ content, className = "" }) => {
  return (
    <div className={`trainee-quiz-rich-text ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <pre className="trainee-quiz-rich-text__code-block">{children}</pre>,
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock = Boolean(codeClassName);
            if (isBlock) {
              return (
                <code className={`trainee-quiz-rich-text__code ${codeClassName ?? ""}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="trainee-quiz-rich-text__inline-code" {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="trainee-quiz-rich-text__paragraph">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default QuizRichText;
