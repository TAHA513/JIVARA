import { db } from './db';
import { products } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function extractAllProducts() {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.id);
  
  console.log(`\n// تم استخراج ${allProducts.length} منتج\n`);
  
  allProducts.forEach((p, idx) => {
    const images = p.images ? `[${p.images.map(img => `'${img}'`).join(', ')}]` : '[]';
    const imagesData = p.imagesData ? `[${p.imagesData.map(img => `\`${img}\``).join(', ')}]` : 'undefined';
    
    console.log(`        {
          name: '${p.name?.replace(/'/g, "\\'")}',
          nameAr: '${p.nameAr?.replace(/'/g, "\\'")}',
          description: '${(p.description || '').replace(/'/g, "\\'").replace(/\n/g, '\\n')}',
          descriptionAr: '${(p.descriptionAr || '').replace(/'/g, "\\'").replace(/\n/g, '\\n')}',
          price: '${p.price}',
          originalPrice: ${p.originalPrice ? `'${p.originalPrice}'` : 'undefined'},
          categoryId: ${p.categoryId},
          sku: '${p.sku || ''}',
          stock: ${p.stock || 0},
          isActive: true,
          isFeatured: ${p.isFeatured || false},
          images: ${images},
          imagesData: ${imagesData}
        }${idx < allProducts.length - 1 ? ',' : ''}`);
  });
}

extractAllProducts().catch(console.error).finally(() => process.exit(0));
