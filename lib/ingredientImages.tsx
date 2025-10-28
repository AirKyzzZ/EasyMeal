import Image from 'next/image';
import { mealApiService } from './api';

interface IngredientImageProps {
  ingredient: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function IngredientImage({ ingredient, size = 'small', className = '' }: IngredientImageProps) {
  const imageUrl = mealApiService.getIngredientThumbnailUrl(ingredient, size);
  
  return (
    <div className={`relative inline-block ${className}`}>
      <Image
        src={imageUrl}
        alt={ingredient}
        width={size === 'small' ? 20 : size === 'medium' ? 24 : 32}
        height={size === 'small' ? 20 : size === 'medium' ? 24 : 32}
        className="rounded-sm object-cover"
        onError={(e) => {
          // Fallback to a generic ingredient icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'flex items-center justify-center bg-gray-200 text-gray-500 text-xs font-medium rounded-sm';
          fallback.style.width = `${size === 'small' ? 20 : size === 'medium' ? 24 : 32}px`;
          fallback.style.height = `${size === 'small' ? 20 : size === 'medium' ? 24 : 32}px`;
          fallback.textContent = ingredient.charAt(0).toUpperCase();
          target.parentNode?.appendChild(fallback);
        }}
      />
    </div>
  );
}

// Fallback emoji function for cases where we still need emojis
export function getIngredientEmoji(ingredient: string): string {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Fruits
  if (lowerIngredient.includes('apple') || lowerIngredient.includes('fruit')) return '🍎';
  if (lowerIngredient.includes('banana')) return '🍌';
  if (lowerIngredient.includes('orange') || lowerIngredient.includes('citrus')) return '🍊';
  if (lowerIngredient.includes('lemon') || lowerIngredient.includes('lime')) return '🍋';
  if (lowerIngredient.includes('grape')) return '🍇';
  if (lowerIngredient.includes('strawberry') || lowerIngredient.includes('berry')) return '🍓';
  if (lowerIngredient.includes('cherry')) return '🍒';
  if (lowerIngredient.includes('peach')) return '🍑';
  if (lowerIngredient.includes('pineapple')) return '🍍';
  if (lowerIngredient.includes('watermelon')) return '🍉';
  if (lowerIngredient.includes('melon')) return '🍈';
  
  // Vegetables
  if (lowerIngredient.includes('carrot')) return '🥕';
  if (lowerIngredient.includes('broccoli')) return '🥦';
  if (lowerIngredient.includes('corn')) return '🌽';
  if (lowerIngredient.includes('mushroom')) return '🍄';
  if (lowerIngredient.includes('tomato')) return '🍅';
  if (lowerIngredient.includes('potato') || lowerIngredient.includes('sweet potato')) return '🥔';
  if (lowerIngredient.includes('onion')) return '🧅';
  if (lowerIngredient.includes('garlic')) return '🧄';
  if (lowerIngredient.includes('pepper') || lowerIngredient.includes('bell pepper')) return '🫑';
  if (lowerIngredient.includes('cucumber')) return '🥒';
  if (lowerIngredient.includes('lettuce') || lowerIngredient.includes('salad')) return '🥬';
  if (lowerIngredient.includes('spinach')) return '🥬';
  if (lowerIngredient.includes('cabbage')) return '🥬';
  
  // Proteins
  if (lowerIngredient.includes('chicken') || lowerIngredient.includes('poultry')) return '🐔';
  if (lowerIngredient.includes('beef') || lowerIngredient.includes('steak')) return '🥩';
  if (lowerIngredient.includes('pork')) return '🐷';
  if (lowerIngredient.includes('fish') || lowerIngredient.includes('salmon') || lowerIngredient.includes('tuna')) return '🐟';
  if (lowerIngredient.includes('shrimp') || lowerIngredient.includes('prawn')) return '🦐';
  if (lowerIngredient.includes('crab')) return '🦀';
  if (lowerIngredient.includes('lobster')) return '🦞';
  if (lowerIngredient.includes('egg')) return '🥚';
  if (lowerIngredient.includes('bacon')) return '🥓';
  if (lowerIngredient.includes('ham')) return '🍖';
  if (lowerIngredient.includes('sausage')) return '🌭';
  
  // Dairy
  if (lowerIngredient.includes('milk')) return '🥛';
  if (lowerIngredient.includes('cheese')) return '🧀';
  if (lowerIngredient.includes('butter')) return '🧈';
  if (lowerIngredient.includes('cream')) return '🥛';
  if (lowerIngredient.includes('yogurt')) return '🥛';
  
  // Grains & Bread
  if (lowerIngredient.includes('bread') || lowerIngredient.includes('toast')) return '🍞';
  if (lowerIngredient.includes('rice')) return '🍚';
  if (lowerIngredient.includes('pasta') || lowerIngredient.includes('noodle')) return '🍝';
  if (lowerIngredient.includes('pizza')) return '🍕';
  if (lowerIngredient.includes('sandwich')) return '🥪';
  if (lowerIngredient.includes('bagel')) return '🥯';
  if (lowerIngredient.includes('croissant')) return '🥐';
  
  // Nuts & Seeds
  if (lowerIngredient.includes('nut') || lowerIngredient.includes('almond') || lowerIngredient.includes('walnut')) return '🥜';
  if (lowerIngredient.includes('seed') || lowerIngredient.includes('sesame')) return '🌰';
  
  // Herbs & Spices
  if (lowerIngredient.includes('herb') || lowerIngredient.includes('basil') || lowerIngredient.includes('oregano')) return '🌿';
  if (lowerIngredient.includes('spice') || lowerIngredient.includes('pepper') || lowerIngredient.includes('salt')) return '🧂';
  if (lowerIngredient.includes('ginger')) return '🫚';
  if (lowerIngredient.includes('cinnamon')) return '🍯';
  
  // Oils & Condiments
  if (lowerIngredient.includes('oil') || lowerIngredient.includes('olive')) return '🫒';
  if (lowerIngredient.includes('vinegar')) return '🍶';
  if (lowerIngredient.includes('soy') || lowerIngredient.includes('sauce')) return '🍶';
  if (lowerIngredient.includes('ketchup')) return '🍅';
  if (lowerIngredient.includes('mustard')) return '🟡';
  if (lowerIngredient.includes('mayonnaise') || lowerIngredient.includes('mayo')) return '🥄';
  
  // Sweet & Desserts
  if (lowerIngredient.includes('sugar') || lowerIngredient.includes('sweet')) return '🍯';
  if (lowerIngredient.includes('chocolate') || lowerIngredient.includes('cocoa')) return '🍫';
  if (lowerIngredient.includes('vanilla')) return '🍦';
  if (lowerIngredient.includes('honey')) return '🍯';
  if (lowerIngredient.includes('maple')) return '🍁';
  
  // Beverages
  if (lowerIngredient.includes('coffee')) return '☕';
  if (lowerIngredient.includes('tea')) return '🍵';
  if (lowerIngredient.includes('juice')) return '🧃';
  if (lowerIngredient.includes('wine')) return '🍷';
  if (lowerIngredient.includes('beer')) return '🍺';
  
  // Default apple emoji for unmatched ingredients
  return '🍎';
}
