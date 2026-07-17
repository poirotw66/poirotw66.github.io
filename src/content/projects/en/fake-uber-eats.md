---
title: "Uber Eats Not!!: Looks Orderable, Actually Isn't"
description: "A highly replica static spoof site of Uber Eats, featuring data from 361 real restaurants, full map tracking, fake checkout and delivery, deployed for free on GitHub Pages."
pubDate: 2024-05-01
tier: lab
subtitle: "純前端 · GitHub Pages · Playwright 爬蟲 · OSRM"
repoUrl: "https://github.com/poirotw66/fake-uber-eats"
metrics:
  - "361 家餐廳索引"
  - "16 種惡搞載具"
  - "0 框架純前端"
impact: "All the appetite, none of the delivery."
image: "/projects/fake-uber-eats/og-cover.png"
---

**Uber Eats Not!!** is a highly realistic static spoof site of Uber Eats. Its goal is to provide a delivery ordering experience with "all the impulse, none of the consequences": the food won't arrive, your money won't decrease, but the dopamine will hit. If you're scrolling through your phone in the middle of the night, feeling hungry, but don't want to actually spend money on ordering food, this place will provide you with immense emotional value.

👉 **Live Demo:** [www.bloss0m.com/fake-uber-eats/](http://www.bloss0m.com/fake-uber-eats/)

---

## 1. Project Background and Pain Points

Food delivery platforms have encapsulated the "impulse to order" too perfectly. Sometimes we just want to experience the process of "browsing menus, adding to cart, and waiting for delivery," without wanting to generate real transactions and calories. How can we preserve its UX without triggering a real transaction?

The challenge faced by this project is: it needs to closely resemble the visual and interactive experience of the Uber Eats Taiwan version; restaurant and menu data must come from real listings; but at the same time, it can only be a static website, without the burden of a backend server (zero backend, zero cash flow). In addition, it also needs to implement a real delivery tracking route on the map to complete the ritualistic feeling of "pretend delivery."

---

## 2. Core Concepts and Solutions

**Uber Eats Not!!** is a pure frontend static website deployed on GitHub Pages. It pre-scrapes real Uber Eats listing data via Playwright and converts the menus into static JSON files and WebP images. Users can fully walk through the process of "selecting a store → menu → shopping cart → checkout → delivery tracking → celebrating the delivery."

- **Visual and Interactive Restoration**: The homepage feed supports search, categorization, and sorting, and implements infinite scrolling for incremental rendering; the shopping cart supports tips and fake checkout amount calculation.
- **Data Scraping Pipeline**: Uses Python (Playwright) to pre-export real data, optimizes image conversion, and allows the webpage to operate by only loading static files.
- **Diverse Spoof Vehicles**: Supports 16 types of delivery vehicles (including helicopters, submarines, UFOs, etc.), switching between different movement modes and routing algorithms based on the vehicle.

---

## 3. Interface and User Experience

### 3.1 Homepage Feed

![Homepage Feed](/projects/fake-uber-eats/01-home-feed.png)

The default address is around Taipei 101, providing an index of 361 restaurants. It supports sorting by distance, rating, delivery time, etc.

### 3.2 Restaurants and Menus

![Restaurant Menu](/projects/fake-uber-eats/02-restaurant-menu.png)

After clicking into any restaurant, it loads the static JSON menu of that store on demand, supports item search, with images undergoing WebP compression and thumbnail optimization.

### 3.3 Shopping Cart and Checkout

![Checkout Process](/projects/fake-uber-eats/03-checkout.png)

You can adjust quantities, select tips, and click on pure UI payment methods. Submitting an order will not result in any real deductions.

### 3.4 Spoof Delivery Tracking

![Delivery Tracking](/projects/fake-uber-eats/04-tracking-map.png)

The map displays the store, the delivery driver, and the destination. You can choose a "submarine" to go straight underground, or a "UFO" to fly in the air, and the delivery driver will move along the calculated route and animation mode.

### 3.5 Delivery Celebration

![Delivery Celebration](/projects/fake-uber-eats/05-meet-driver-reveal.png)

Upon delivery, it provides full-screen celebration animations (confetti, emoji rain), mobile phone vibration feedback, and you can give the "fake delivery driver" a five-star rating.

---

## 4. Technical Architecture Analysis

The system is divided into two parts: the data pipeline and the pure frontend webpage:

1. **Python Scraper Data Pipeline**: Playwright scraping → converting images to WebP and generating thumbnails → establishing the JSON Feed index.
2. **Frontend Execution**: Bundled with Vite, pure HTML/CSS/JavaScript, zero React/Vue frameworks, using ESM modularization.
3. **Map and Routing**: Uses Leaflet + OpenStreetMap tiles, paired with OSRM (Open Source Routing Machine) for real road delivery route planning.

Through the pure static site architecture, the original over 300 MB of images are heavily compressed to about 86 MB. The core JS bundle is only about 64 KB (gzip ~20 KB), capable of running smoothly on GitHub Pages.

---

## 5. Conclusion and Disclaimer

**Uber Eats Not!!** successfully restores the design intention of "All the appetite, none of the delivery," providing a highly emotional ordering process, and demonstrates the technical integration of web scraping, frontend performance tuning, map animation, and modular development.

- This project has no affiliation with Uber Eats or Uber; it is purely for parody / educational and entertainment purposes.
- Restaurant names, menus, and images may come from scraped exports of public listings; please do not use them for commercial ordering, impersonating official entities, or any actions that violate terms of service.
- Does not involve real payments, real delivery, or user account systems.
