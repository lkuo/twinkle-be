module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('rewards', 'child_ids', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('rewards', 'child_ids');
  },
};
