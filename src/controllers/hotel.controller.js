const Hotel = require('../models/Hotel');

// Créer un hôtel
exports.creerHotel = async (req, res) => {
  try {
    const { nom, adresse, email, telephone, prixParNuit, devise, photo } = req.body;
    const hotel = await Hotel.create({
      nom, adresse, email, telephone, prixParNuit, devise, photo,
      user: req.user.id
    });
    res.status(201).json({ message: 'Hôtel créé avec succès', hotel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister les hôtels de l'utilisateur connecté
exports.getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ user: req.user.id });
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un hôtel par ID
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hôtel non trouvé' });
    }
    res.status(200).json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modifier un hôtel
exports.modifierHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hotel) {
      return res.status(404).json({ message: 'Hôtel non trouvé' });
    }
    res.status(200).json({ message: 'Hôtel modifié avec succès', hotel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un hôtel
exports.supprimerHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hôtel non trouvé' });
    }
    res.status(200).json({ message: 'Hôtel supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};