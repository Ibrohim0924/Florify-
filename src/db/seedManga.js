import mongoose from 'mongoose';
import Manga from '../model/manga.js';
import Chapter from '../model/chapter.js';
import User from '../model/user.js';
import Review from '../model/review.js';
import { ConnectDB } from './index.js';

const sampleManga = [
  {
    title: "One Piece",
    alternativeTitles: ["ワンピース"],
    author: "Eiichiro Oda",
    artist: "Eiichiro Oda",
    description: "Gol D. Roger was known as the Pirate King, the strongest and most infamous being to have sailed the Grand Line. The capture and death of Roger by the World Government brought a change throughout the world. His last words before his death revealed the location of the greatest treasure in the world, One Piece. It was this revelation that brought about the Grand Age of Pirates, men who dreamed of finding One Piece (which promises an unlimited amount of riches and fame), and quite possibly the most coveted of titles for the person who found it, the title of the Pirate King.",
    genres: ["Action", "Adventure", "Comedy", "Drama", "Shounen"],
    status: "Ongoing",
    type: "Manga",
    coverImage: "https://example.com/onepiece-cover.jpg",
    releaseYear: 1997,
    serialization: "Weekly Shonen Jump",
    featured: true,
    tags: ["Pirates", "Devil Fruit", "Adventure", "Friendship"],
    ageRating: "13+"
  },
  {
    title: "Attack on Titan",
    alternativeTitles: ["Shingeki no Kyojin", "進撃の巨人"],
    author: "Hajime Isayama",
    artist: "Hajime Isayama",
    description: "Several hundred years ago, humans were nearly exterminated by giants. Giants are typically several stories tall, seem to have no intelligence, devour human beings and, worst of all, seem to do it for the pleasure rather than as a food source. A small percentage of humanity survived by walling themselves in a city protected by extremely high walls, even taller than the biggest of giants. Flash forward to the present and the city has not seen a giant in over 100 years. Teenage boy Eren and his foster sister Mikasa witness something horrific as the city walls are destroyed by a colossal giant that appears out of thin air.",
    genres: ["Action", "Drama", "Fantasy", "Horror", "Shounen"],
    status: "Completed",
    type: "Manga",
    coverImage: "https://example.com/aot-cover.jpg",
    releaseYear: 2009,
    serialization: "Bessatsu Shonen Magazine",
    featured: true,
    tags: ["Titans", "Military", "Dark", "Survival"],
    ageRating: "16+"
  },
  {
    title: "Demon Slayer",
    alternativeTitles: ["Kimetsu no Yaiba", "鬼滅の刃"],
    author: "Koyoharu Gotouge",
    artist: "Koyoharu Gotouge",
    description: "Since ancient times, rumors have abounded of man-eating demons lurking in the woods. Because of this, the local townsfolk never venture outside at night. Legend has it that a demon slayer also roams the night, hunting down these bloodthirsty demons. For young Tanjirou, these rumors will soon to become his harsh reality. Ever since the death of his father, Tanjirou has taken it upon himself to support his family. Although their lives may be hardened by tragedy, they've found happiness. But that ephemeral warmth is shattered one day when Tanjirou finds his family slaughtered and the lone survivor, his sister Nezuko, turned into a demon.",
    genres: ["Action", "Historical", "Shounen", "Supernatural"],
    status: "Completed",
    type: "Manga",
    coverImage: "https://example.com/demonslayer-cover.jpg",
    releaseYear: 2016,
    serialization: "Weekly Shonen Jump",
    featured: true,
    tags: ["Demons", "Swords", "Family", "Tragedy"],
    ageRating: "13+"
  },
  {
    title: "My Hero Academia",
    alternativeTitles: ["Boku no Hero Academia", "僕のヒーローアカデミア"],
    author: "Kohei Horikoshi",
    artist: "Kohei Horikoshi",
    description: "In a world where eighty percent of the population has some kind of super-powered Quirk, Izuku was unlucky enough to be born completely normal. But that won't stop him from enrolling in a prestigious hero academy. Now, he'll get his first taste of brutal rivalry from other schools as he braves the cutthroat, no-holds-barred provisional license exam.",
    genres: ["Action", "School Life", "Shounen", "Superhero"],
    status: "Ongoing",
    type: "Manga",
    coverImage: "https://example.com/mha-cover.jpg",
    releaseYear: 2014,
    serialization: "Weekly Shonen Jump",
    featured: true,
    tags: ["Quirks", "Heroes", "School", "Coming of Age"],
    ageRating: "13+"
  },
  {
    title: "Jujutsu Kaisen",
    alternativeTitles: ["呪術廻戦"],
    author: "Gege Akutami",
    artist: "Gege Akutami",
    description: "Although Yuji Itadori looks like your average teenager, his immense physical strength is something to behold! Every sports club wants him to join, but Itadori would rather hang out with the school outcasts in the Occult Research Club. One day, the club manages to get their hands on a sealed cursed object. Little do they know the terror they'll unleash when they break the seal...",
    genres: ["Action", "School Life", "Shounen", "Supernatural"],
    status: "Ongoing",
    type: "Manga",
    coverImage: "https://example.com/jjk-cover.jpg",
    releaseYear: 2018,
    serialization: "Weekly Shonen Jump",
    featured: true,
    tags: ["Curses", "Sorcery", "School", "Dark"],
    ageRating: "16+"
  }
];

const sampleChapters = [
  // One Piece chapters
  {
    title: "Romance Dawn",
    chapterNumber: 1,
    mangaTitle: "One Piece",
    pages: [
      { pageNumber: 1, imageUrl: "https://example.com/op-1-1.jpg" },
      { pageNumber: 2, imageUrl: "https://example.com/op-1-2.jpg" },
      { pageNumber: 3, imageUrl: "https://example.com/op-1-3.jpg" }
    ]
  },
  {
    title: "That Man Is 'Straw Hat Luffy'",
    chapterNumber: 2,
    mangaTitle: "One Piece",
    pages: [
      { pageNumber: 1, imageUrl: "https://example.com/op-2-1.jpg" },
      { pageNumber: 2, imageUrl: "https://example.com/op-2-2.jpg" }
    ]
  },
  // Attack on Titan chapters
  {
    title: "To You, in 2000 Years",
    chapterNumber: 1,
    mangaTitle: "Attack on Titan",
    pages: [
      { pageNumber: 1, imageUrl: "https://example.com/aot-1-1.jpg" },
      { pageNumber: 2, imageUrl: "https://example.com/aot-1-2.jpg" }
    ]
  }
];

export async function seedManga() {
  try {
    console.log('🌱 Starting manga database seeding...');

    // Clear existing data
    await Manga.deleteMany({});
    await Chapter.deleteMany({});
    console.log('✅ Cleared existing manga data');

    // Create manga
    const createdManga = [];
    for (const mangaData of sampleManga) {
      const manga = new Manga(mangaData);
      await manga.save();
      createdManga.push(manga);
      console.log(`✅ Created manga: ${manga.title}`);
    }

    // Create chapters
    for (const chapterData of sampleChapters) {
      const manga = createdManga.find(m => m.title === chapterData.mangaTitle);
      if (manga) {
        const chapter = new Chapter({
          ...chapterData,
          mangaId: manga._id
        });
        await chapter.save();

        // Add chapter to manga
        manga.chapters.push(chapter._id);
        await manga.save();

        console.log(`✅ Created chapter: ${chapter.title} for ${manga.title}`);
      }
    }

    // Update manga ratings with random data
    for (const manga of createdManga) {
      const randomRating = (Math.random() * 4 + 6).toFixed(1); // Rating between 6.0 and 10.0
      const randomViews = Math.floor(Math.random() * 1000000) + 50000; // Views between 50k and 1M
      const randomFavorites = Math.floor(Math.random() * 10000) + 1000; // Favorites between 1k and 10k

      manga.rating.average = parseFloat(randomRating);
      manga.rating.count = Math.floor(Math.random() * 500) + 100;
      manga.popularity.views = randomViews;
      manga.popularity.favorites = randomFavorites;
      
      await manga.save();
    }

    console.log('🎉 Manga database seeded successfully!');
    console.log(`📚 Created ${createdManga.length} manga`);
    console.log(`📖 Created ${sampleChapters.length} chapters`);

  } catch (error) {
    console.error('❌ Error seeding manga database:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await ConnectDB();
    await seedManga();
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}