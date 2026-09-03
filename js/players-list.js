const PRESET_PLAYERS = ["Louanne", "Alan", "Mewen", "Tiphaine", "Garance", "Maryline"];

function slugify(name) {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
