import fs from 'fs';
import path from 'path';

const apiKey = process.env.OPENAI_API_KEY!;
const imagePath = path.resolve('attached_assets/ChatGPT_Image_Apr_22,_2026,_03_23_39_AM_1776824743307.png');
const base64Image = fs.readFileSync(imagePath).toString('base64');

async function run() {
  console.log("🔍 الخطوة 1: GPT-4 Vision يحلل الصورة...");

  const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a product photography expert. Analyze this bamboo socks advertisement image and write an extremely detailed DALL-E 3 prompt to recreate a SIMILAR product advertisement with:
- The EXACT same dark gift box (black/dark gray rectangular box open from top)  
- The EXACT same 5 pairs of socks neatly stacked inside: black on top, then navy blue, dark gray, light gray, white at bottom
- The EXACT same sock label "Bamboo" embroidered in gold/white
- A dark green background with subtle bamboo leaves
- Premium luxury product photography style
- Same beige/cream curved section on the left side
- One black sock displayed outside the box to the right
Write ONLY the image generation prompt, nothing else. Be very specific about colors and positioning.`
          },
          { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}`, detail: "high" } }
        ]
      }],
      max_tokens: 500,
    }),
  });

  const visionData = await visionRes.json() as any;
  if (visionData.error) { console.error("Vision error:", visionData.error); process.exit(1); }
  const basePrompt = visionData.choices[0].message.content;
  console.log("✅ Prompt جاهز:", basePrompt.substring(0, 200) + "...\n");

  const styles = [
    "elegant dark studio with golden accent lighting, luxury premium feel",
    "clean white marble background, minimalist style, bright natural light",
    "deep forest green background, bamboo leaves bokeh, warm earthy tones",
  ];

  const outputDir = 'public/generated';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  for (let i = 0; i < styles.length; i++) {
    console.log(`🎨 توليد تصميم ${i + 1}/3...`);
    const prompt = `${basePrompt}. Style: ${styles[i]}. Ultra realistic commercial product photography, 4K quality.`;

    const genRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", quality: "hd", response_format: "url" }),
    });

    const genData = await genRes.json() as any;
    if (genData.error) { console.error(`Error ${i+1}:`, genData.error.message); continue; }

    const url = genData.data[0].url;
    console.log(`✅ تصميم ${i + 1}: ${url}`);

    // تحميل الصورة وحفظها
    const imgRes = await fetch(url);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const filename = `bamboo-design-${i + 1}.png`;
    fs.writeFileSync(path.join(outputDir, filename), imgBuffer);
    console.log(`💾 محفوظة: public/generated/${filename}`);
  }

  console.log("\n🎉 تم توليد جميع التصاميم في مجلد public/generated/");
}

run().catch(console.error);
