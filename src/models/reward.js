const {
  paginationScope,
  filterScope,
  SCOPES,
} = require('@utils/sequelizeUtils');

module.exports = (sequelize, DataTypes) => {
  const children = sequelize.define(
    'Reward',
    {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        field: 'description',
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        field: 'amount',
        allowNull: false,
      },
      familyId: {
        type: DataTypes.INTEGER,
        field: 'family_id',
        allowNull: false,
      },
      childIds: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        field: 'child_ids',
        allowNull: false,
      }
    },
    {
      tableName: 'rewards',
      paranoid: true,
      timestamps: true,
      underscored: true,
    }
  );
  children.associate = function () {
    this.addScope(SCOPES.FILTER, filterScope);
    this.addScope(SCOPES.PAGINATION, paginationScope);
  };
  return children;
};
