module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('members', 'avatar', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('members', 'family_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('members', 'family_id');
    await queryInterface.removeColumn('members', 'avatar');
  },
};
