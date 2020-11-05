const {
  paginationScope,
  filterScope,
  SCOPES,
} = require('@utils/sequelizeUtils');

module.exports = (sequelize, DataTypes) => {
  const children = sequelize.define(
    'Child',
    {
      id: {
        type: DataTypes.UUID,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: DataTypes.STRING,
        field: 'first_name',
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        field: 'last_name',
        allowNull: false,
      },
      familyId: {
        type: DataTypes.INTEGER,
        field: 'family_id',
        allowNull: false,
      },
    },
    {
      tableName: 'children',
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
