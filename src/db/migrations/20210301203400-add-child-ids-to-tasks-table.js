module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tasks', 'child_ids', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('tasks', 'child_ids');
  },
};
