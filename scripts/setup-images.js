// scripts/setup-images.js
// სურათების საქაღალდეების შექმნის სკრიპტი

const fs = require('fs');
const path = require('path');
const https = require('https');

// საჭირო საქაღალდეების სია
const requiredDirectories = [
  'public/images',
  'public/images/icons',
  'public/images/general',
  'public/images/avatars',
  'public/images/covers'
];

// საწყისი იკონების სია
const defaultIcons = [
  {
    name: 'back.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>'
  },
  {
    name: 'home.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
  },
  {
    name: 'explore.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
  },
  {
    name: 'message.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
  },
  {
    name: 'emoji.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>'
  },
  {
    name: 'image.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
  },
  {
    name: 'more.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>'
  },
  {
    name: 'notification.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
  },
  {
    name: 'logo.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>'
  },
  {
    name: 'date.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71767b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
  }
];

// ჩამოტვირთული სურათების სია
const downloadImages = [
  {
    url: 'https://via.placeholder.com/150',
    path: 'public/images/general/placeholder.jpg'
  },
  {
    url: 'https://via.placeholder.com/300',
    path: 'public/images/general/avatar.png'
  },
  {
    url: 'https://via.placeholder.com/1200x400/000000/FFFFFF/?text=Default+Cover',
    path: 'public/images/covers/default-cover.jpg'
  }
];

// სურათის ჩამოტვირთვის ფუნქცია
function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`ჩამოტვირთულია: ${destination}`);
        resolve();
      });
    }).on('error', error => {
      fs.unlink(destination, () => {}); // წაშალე არასრული ფაილი
      reject(error);
    });
  });
}

// საქაღალდეების შექმნა
console.log('საქაღალდეების შექმნა...');

requiredDirectories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`შექმნა: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`უკვე არსებობს: ${dir}`);
  }
});

// საწყისი იკონების შექმნა
console.log('\nსაწყისი იკონების შექმნა...');

defaultIcons.forEach(icon => {
  const iconPath = path.join('public/images/icons', icon.name);
  
  if (!fs.existsSync(iconPath)) {
    console.log(`შექმნა: ${iconPath}`);
    fs.writeFileSync(iconPath, icon.content);
  } else {
    console.log(`უკვე არსებობს: ${iconPath}`);
  }
});

// სურათების ჩამოტვირთვა
console.log('\nსურათების ჩამოტვირთვა...');

(async () => {
  for (const image of downloadImages) {
    try {
      // შევამოწმოთ უკვე არსებობს თუ არა ფაილი
      if (!fs.existsSync(image.path)) {
        // შევქმნათ საქაღალდე თუ არ არსებობს
        const dir = path.dirname(image.path);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // ჩამოვტვირთოთ სურათი
        await downloadImage(image.url, image.path);
      } else {
        console.log(`უკვე არსებობს: ${image.path}`);
      }
    } catch (error) {
      console.error(`შეცდომა ${image.path} ჩამოტვირთვისას:`, error.message);
      
      // შევქმნათ ტექსტური ფაილი შეცდომის შემთხვევაში
      fs.writeFileSync(image.path, `This is a placeholder file.
Please replace with a real image file.`);
    }
  }
  
  console.log('\nსაქაღალდეების და ფაილების სტრუქტურა წარმატებით შეიქმნა!');
  console.log('გთხოვთ, ჩაანაცვლოთ პლეისჰოლდერები რეალური სურათებით.');
})();