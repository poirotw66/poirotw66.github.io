const TYPES = ['blog', 'paperReading', 'projects'];

export function encodeSearchItems(items) {
  const categories = [...new Set(items.map((item) => item.category))];
  const tags = [...new Set(items.flatMap((item) => item.tags))];
  const dates = [...new Set(items.map((item) => item.date))];
  return {
    version: 1, categories, tags, dates,
    items: items.map((item) => [
      TYPES.indexOf(item.type), item.title, item.description, item.url,
      dates.indexOf(item.date), item.tags.map((tag) => tags.indexOf(tag)), categories.indexOf(item.category),
    ]),
  };
}

export function decodeSearchItems(data) {
  if (Array.isArray(data)) return data;
  const stringList = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');
  if (data?.version !== 1 || !stringList(data.categories) || !stringList(data.tags) || !stringList(data.dates) || !Array.isArray(data.items)) {
    throw new Error('Invalid search index');
  }
  const at = (list, index) => {
    if (!Number.isInteger(index) || index < 0 || index >= list.length) throw new Error('Invalid search index reference');
    return list[index];
  };
  return data.items.map((row) => {
    if (!Array.isArray(row) || row.length !== 7 || !row.slice(1, 4).every((item) => typeof item === 'string') || !Array.isArray(row[5])) {
      throw new Error('Invalid search index row');
    }
    return {
      type: at(TYPES, row[0]), title: row[1], description: row[2], url: row[3],
      date: at(data.dates, row[4]), tags: row[5].map((index) => at(data.tags, index)), category: at(data.categories, row[6]),
    };
  });
}
