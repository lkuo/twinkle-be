module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('tasks', 'family_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('tasks', 'family_id');
  },
};
