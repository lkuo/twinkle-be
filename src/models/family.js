module.exports = (sequelize, DataTypes) => {
  const children = sequelize.define(
    'Family',
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
    },
    {
      tableName: 'families',
      paranoid: true,
      timestamps: true,
      underscored: true,
    }
  );
  children.associate = function (models) {
    // associations can be defined here
  };
  return children;
};
