export interface TravelPhoto {
  src: string;
  location: string;
  caption: string;
}

// Round-robin: index % 4 maps each photo to a column.
// 6 portrait images (ratio ~1.78, ~570px) distributed: 1 each in cols 0,1 and 2 each in cols 2,3.
// Column heights stay within about 66px of each other for these photos.
export const TRAVEL_PHOTOS: TravelPhoto[] = [
  { src: "/images/gallery/japan1.png",   location: "Japan",    caption: "Japan" },     // col0 L
  { src: "/images/gallery/japan2.png",   location: "Japan",    caption: "Japan" },     // col1 L
  { src: "/images/gallery/japan3.png",   location: "Japan",    caption: "Japan" },     // col2 L
  { src: "/images/gallery/japan4.png",   location: "Japan",    caption: "Japan" },     // col3 L
  { src: "/images/gallery/japan5.png",   location: "Japan",    caption: "Japan" },     // col0 L
  { src: "/images/gallery/japan6.png",   location: "Japan",    caption: "Japan" },     // col1 L
  { src: "/images/gallery/korea5.JPG",   location: "Korea",    caption: "Korea" },     // col2 P
  { src: "/images/gallery/korea6.JPG",   location: "Korea",    caption: "Korea" },     // col3 P
  { src: "/images/gallery/japan7.png",   location: "Japan",    caption: "Japan" },     // col0 L
  { src: "/images/gallery/japan8.png",   location: "Japan",    caption: "Japan" },     // col1 L
  { src: "/images/gallery/japan9.png",   location: "Japan",    caption: "Japan" },     // col2 L
  { src: "/images/gallery/japan10.png",  location: "Japan",    caption: "Japan" },     // col3 L
  { src: "/images/gallery/japan11.png",  location: "Japan",    caption: "Japan" },     // col0 L
  { src: "/images/gallery/japan12.png",  location: "Japan",    caption: "Japan" },     // col1 L
  { src: "/images/gallery/banff1.jpg",   location: "Banff",    caption: "Banff" },     // col2 P
  { src: "/images/gallery/jamaica1.jpg", location: "Jamaica",  caption: "Jamaica" },   // col3 P
  { src: "/images/gallery/korea7.JPG",   location: "Korea",    caption: "Korea" },     // col0 P
  { src: "/images/gallery/newyork1.jpg", location: "New York", caption: "New York" },  // col1 P
  { src: "/images/gallery/japan13.png",  location: "Japan",    caption: "Japan" },     // col2 L
  { src: "/images/gallery/japan14.png",  location: "Japan",    caption: "Japan" },     // col3 L
  { src: "/images/gallery/japan15.png",  location: "Japan",    caption: "Japan" },     // col0 L
  { src: "/images/gallery/japan16.png",  location: "Japan",    caption: "Japan" },     // col1 L
  { src: "/images/gallery/japan17.png",  location: "Japan",    caption: "Japan" },     // col2 L
  { src: "/images/gallery/korea1.png",   location: "Korea",    caption: "Korea" },     // col3 L
  { src: "/images/gallery/korea2.png",   location: "Korea",    caption: "Korea" },     // col0 L
  { src: "/images/gallery/korea3.png",   location: "Korea",    caption: "Korea" },     // col1 L
];

export const STACKED_BELOW = new Set<string>();
