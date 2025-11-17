
import { promises as fs } from 'fs';
import path from 'path';
import { CopyButton } from './copy-button';

async function getFileContent() {
  const filePath = path.join(process.cwd(), 'docs', 'app-features-prompt.md');
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return fileContent;
  } catch (error) {
    console.error("Error reading file:", error);
    return "Özellikler dosyası okunurken bir hata oluştu.";
  }
}

export default async function FeaturesPromptPage() {
  const content = await getFileContent();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative bg-muted/30 rounded-lg border p-6">
        <div className="absolute top-4 right-4">
          <CopyButton textToCopy={content} />
        </div>
        <h1 className="text-2xl font-headline font-bold mb-4">Uygulama Özellikleri Prompt'u</h1>
        <pre className="whitespace-pre-wrap text-sm font-sans text-foreground/90 overflow-auto">
          <code>
            {content}
          </code>
        </pre>
      </div>
    </div>
  );
}
