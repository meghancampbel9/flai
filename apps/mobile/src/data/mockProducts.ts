import { Product } from '@/types/product';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Oversized Fur Coat',
    brand: 'Collina Strada',
    price: 1130,
    currency: '€',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop',
    is_on_sale: false,
    category: 'outerwear',
    description: 'A luxurious and ethically sourced oversized fur coat, perfect for making a statement. Features a soft, plush texture and a comfortable, modern fit. Lined with satin for extra comfort.'
  },
  {
    id: '2',
    name: 'Little Black Dress',
    brand: 'Reformation',
    price: 250,
    currency: '€',
    image_url: 'https://images.unsplash.com/photo-1548552242-555dab86419a?w=400&h=600&fit=crop',
    is_on_sale: true,
    original_price: 320,
    category: 'dresses',
    description: 'The quintessential little black dress, updated with a modern silhouette. Made from lightweight, sustainably sourced crepe fabric. Features a flattering V-neck and a concealed side zipper.'
  },
  {
    id: '3',
    name: 'Pink Oversized Sweatshirt',
    brand: 'Ganni',
    price: 180,
    currency: '€',
    image_url: 'https://images.unsplash.com/photo-1578932750346-c1874103ab32?w=400&h=600&fit=crop',
    is_on_sale: false,
    category: 'tops',
    description: 'A cozy and stylish oversized sweatshirt in a vibrant pink hue. Made from a soft organic cotton blend with a fleece interior. Perfect for a relaxed, everyday look.'
  },
  {
    id: '4',
    name: 'Classic White Sneakers',
    brand: 'Veja',
    price: 125,
    currency: '€',
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=600&fit=crop',
    is_on_sale: false,
    category: 'shoes',
    description: 'Timeless and versatile white sneakers crafted from sustainable and recycled materials. Features a minimalist design with a durable rubber sole, suitable for any occasion.'
  },
  {
    id: '5',
    name: 'High-Waisted Denim Jeans',
    brand: 'Levi\'s',
    price: 110,
    currency: '€',
    image_url: 'https://images.unsplash.com/photo-1602293589930-45d7de9b8704?w=400&h=600&fit=crop',
    is_on_sale: false,
    category: 'denim',
    description: 'Classic high-waisted denim jeans with a straight-leg fit. Made from premium, durable cotton with a hint of stretch for comfort. Features the iconic five-pocket design.'
  },
  {
    id: '6',
    name: 'Silk Cami Top',
    brand: 'Anine Bing',
    price: 150,
    currency: '€',
    image_url: 'https://images.unsplash.com/photo-1542838384-d2c744a6962b?w=400&h=600&fit=crop',
    is_on_sale: true,
    original_price: 200,
    category: 'tops',
    description: 'A delicate and elegant camisole top crafted from 100% pure silk. Features adjustable spaghetti straps and a subtle V-neckline. Perfect for layering or wearing on its own.'
  }
];

export const mockClosetItems: Product[] = [
  mockProducts[0],
  mockProducts[2],
];

export const mockWishlistItems: Product[] = [
  mockProducts[1],
  mockProducts[3],
  mockProducts[5],
];

export const mockRecommendedItems: Product[] = [
  ...mockProducts
]; 