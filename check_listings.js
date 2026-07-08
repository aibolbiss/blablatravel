const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, city, country, is_active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Всего объявлений:', data.length);
  console.log('\nОбъявления:');
  data.forEach(l => {
    console.log(`- "${l.title.substring(0, 50)}" | Город: ${l.city} | Страна: ${l.country} | Активно: ${l.is_active}`);
  });

  // Filter for Samarkand
  const samarkand = data.filter(l => l.city && l.city.toLowerCase().includes('samar'));
  console.log('\n\nОсновано в Самаркан(д):');
  samarkand.forEach(l => {
    console.log(`- ID: ${l.id} | "${l.title}" | Город: ${l.city} | Активно: ${l.is_active}`);
  });
}

check();
