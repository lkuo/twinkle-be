const {
  paginationScope,
  filterScope,
  SCOPES,
} = require('@utils/sequelizeUtils');

module.exports = (sequelize, DataTypes) => {
  const tasks = sequelize.define(
    'Statement',
    {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      childId: {
        type: DataTypes.INTEGER,
        field: 'child_id',
        allowNull: false,
      },
      familyId: {
        type: DataTypes.INTEGER,
        field: 'family_id',
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        field: 'amount',
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        field: 'metadata',
        allowNull: false,
      },
      actorId: {
        type: DataTypes.INTEGER,
        field: 'actor_id',
        allowNull: false,
      },
    },
    {
      tableName: 'statements',
      paranoid: true,
      timestamps: true,
      underscored: true,
    }
  );
  tasks.associate = function () {
    this.addScope(SCOPES.FILTER, filterScope);
    this.addScope(SCOPES.PAGINATION, paginationScope);
  };
  return tasks;
};
