import { Area, Category, Ingredient, Meal } from '@/types/meal';

export function getFallbackMeals(): Meal[] {
  return [
    {
      idMeal: 'fallback-1',
      strMeal: 'Classic Spaghetti Carbonara',
      strCategory: 'Pasta',
      strArea: 'Italian',
      strInstructions:
        'Cook pasta according to package directions. In a bowl, whisk eggs and cheese. Cook bacon until crispy. Toss hot pasta with bacon, then with egg mixture. Serve immediately.',
      strMealThumb:
        'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
      strTags: 'Pasta,Italian,Comfort Food',
      strIngredient1: 'Spaghetti',
      strIngredient2: 'Eggs',
      strIngredient3: 'Parmesan Cheese',
      strIngredient4: 'Bacon',
      strIngredient5: 'Black Pepper',
      strMeasure1: '400g',
      strMeasure2: '4 large',
      strMeasure3: '100g grated',
      strMeasure4: '200g diced',
      strMeasure5: 'To taste',
    },
    {
      idMeal: 'fallback-2',
      strMeal: 'Grilled Chicken Salad',
      strCategory: 'Chicken',
      strArea: 'American',
      strInstructions:
        'Season chicken breast with salt and pepper. Grill for 6-7 minutes per side. Let rest, then slice. Toss mixed greens with your favorite dressing. Top with sliced chicken, cherry tomatoes, and avocado.',
      strMealThumb:
        'https://www.themealdb.com/images/media/meals/1543774956.jpg',
      strTags: 'Healthy,Salad,Grilled',
      strIngredient1: 'Chicken Breast',
      strIngredient2: 'Mixed Greens',
      strIngredient3: 'Cherry Tomatoes',
      strIngredient4: 'Avocado',
      strIngredient5: 'Olive Oil',
      strMeasure1: '2 pieces',
      strMeasure2: '4 cups',
      strMeasure3: '1 cup',
      strMeasure4: '1 medium',
      strMeasure5: '2 tbsp',
    },
    {
      idMeal: 'fallback-3',
      strMeal: 'Vegetable Stir Fry',
      strCategory: 'Vegetarian',
      strArea: 'Chinese',
      strInstructions:
        'Heat oil in a wok or large pan. Add garlic and ginger, stir for 30 seconds. Add vegetables in order of cooking time (hardest first). Stir fry for 3-4 minutes. Add sauce and toss to combine.',
      strMealThumb:
        'https://www.themealdb.com/images/media/meals/1525873040.jpg',
      strTags: 'Vegetarian,Healthy,Quick',
      strIngredient1: 'Broccoli',
      strIngredient2: 'Carrots',
      strIngredient3: 'Bell Peppers',
      strIngredient4: 'Soy Sauce',
      strIngredient5: 'Garlic',
      strMeasure1: '2 cups',
      strMeasure2: '1 cup sliced',
      strMeasure3: '1 large',
      strMeasure4: '3 tbsp',
      strMeasure5: '3 cloves',
    },
    {
      idMeal: 'fallback-4',
      strMeal: 'Simple Beef Stir Fry',
      strCategory: 'Beef',
      strArea: 'Chinese',
      strInstructions:
        'Slice beef thinly. Heat oil in a pan, cook beef until browned. Add vegetables and stir fry for 3-4 minutes. Add sauce and cook for 1 more minute.',
      strMealThumb:
        'https://www.themealdb.com/images/media/meals/1525873040.jpg',
      strTags: 'Beef,Quick,Easy',
      strIngredient1: 'Beef',
      strIngredient2: 'Onion',
      strIngredient3: 'Bell Peppers',
      strIngredient4: 'Soy Sauce',
      strIngredient5: 'Garlic',
      strMeasure1: '300g',
      strMeasure2: '1 medium',
      strMeasure3: '1 large',
      strMeasure4: '3 tbsp',
      strMeasure5: '2 cloves',
    },
    {
      idMeal: 'fallback-5',
      strMeal: 'Creamy Tomato Pasta',
      strCategory: 'Pasta',
      strArea: 'Italian',
      strInstructions:
        'Cook pasta according to package directions. In a pan, sauté garlic and tomatoes. Add cream and simmer. Toss with pasta and serve.',
      strMealThumb:
        'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
      strTags: 'Pasta,Vegetarian,Creamy',
      strIngredient1: 'Pasta',
      strIngredient2: 'Tomatoes',
      strIngredient3: 'Cream',
      strIngredient4: 'Garlic',
      strIngredient5: 'Basil',
      strMeasure1: '400g',
      strMeasure2: '4 large',
      strMeasure3: '200ml',
      strMeasure4: '3 cloves',
      strMeasure5: 'Handful',
    },
    {
      idMeal: 'fallback-6',
      strMeal: 'Fish Tacos',
      strCategory: 'Seafood',
      strArea: 'Mexican',
      strInstructions:
        'Season fish with spices. Cook until flaky. Warm tortillas. Serve fish in tortillas with cabbage slaw and sauce.',
      strMealThumb:
        'https://www.themealdb.com/images/media/meals/1543774956.jpg',
      strTags: 'Fish,Mexican,Healthy',
      strIngredient1: 'White Fish',
      strIngredient2: 'Tortillas',
      strIngredient3: 'Cabbage',
      strIngredient4: 'Lime',
      strIngredient5: 'Cilantro',
      strMeasure1: '500g',
      strMeasure2: '8 pieces',
      strMeasure3: '2 cups',
      strMeasure4: '2 pieces',
      strMeasure5: 'Handful',
    },
  ];
}

export function getFallbackCategories(): Category[] {
  return [
    {
      idCategory: '1',
      strCategory: 'Beef',
      strCategoryThumb: '',
      strCategoryDescription: 'Delicious beef recipes',
    },
    {
      idCategory: '2',
      strCategory: 'Chicken',
      strCategoryThumb: '',
      strCategoryDescription: 'Tasty chicken dishes',
    },
    {
      idCategory: '3',
      strCategory: 'Dessert',
      strCategoryThumb: '',
      strCategoryDescription: 'Sweet treats and desserts',
    },
    {
      idCategory: '4',
      strCategory: 'Pasta',
      strCategoryThumb: '',
      strCategoryDescription: 'Italian pasta recipes',
    },
    {
      idCategory: '5',
      strCategory: 'Vegetarian',
      strCategoryThumb: '',
      strCategoryDescription: 'Plant-based meals',
    },
  ];
}

export function getFallbackAreas(): Area[] {
  return [
    { strArea: 'American' },
    { strArea: 'Italian' },
    { strArea: 'Chinese' },
    { strArea: 'Mexican' },
    { strArea: 'Indian' },
    { strArea: 'French' },
    { strArea: 'Japanese' },
    { strArea: 'Thai' },
  ];
}

export function getFallbackIngredients(): Ingredient[] {
  return [
    { strIngredient: 'Chicken' },
    { strIngredient: 'Beef' },
    { strIngredient: 'Pork' },
    { strIngredient: 'Fish' },
    { strIngredient: 'Eggs' },
    { strIngredient: 'Milk' },
    { strIngredient: 'Cheese' },
    { strIngredient: 'Butter' },
    { strIngredient: 'Onion' },
    { strIngredient: 'Garlic' },
    { strIngredient: 'Tomato' },
    { strIngredient: 'Potato' },
    { strIngredient: 'Rice' },
    { strIngredient: 'Pasta' },
    { strIngredient: 'Bread' },
    { strIngredient: 'Olive Oil' },
    { strIngredient: 'Salt' },
    { strIngredient: 'Pepper' },
    { strIngredient: 'Sugar' },
    { strIngredient: 'Flour' },
  ];
}
