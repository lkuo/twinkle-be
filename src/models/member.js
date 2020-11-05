module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define(
    'Member',
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
      email: {
        type: DataTypes.STRING,
        field: 'email',
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        field: 'password',
        allowNull: false,
      },
      avatar: {
        type: DataTypes.STRING,
        field: 'avatar',
        allowNull: true,
      },
      familyId: {
        type: DataTypes.INTEGER,
        field: 'family_id',
        allowNull: false,
      },
    },
    {
      tableName: 'members',
      paranoid: true,
      timestamps: true,
      underscored: true,
    }
  );
  Member.associate = function (models) {
    // associations can be defined here
  };
  return Member;
};
