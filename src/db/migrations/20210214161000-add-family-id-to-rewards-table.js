module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('rewards', 'family_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('rewards', 'family_id');
  },
};
