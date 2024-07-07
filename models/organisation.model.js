const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./user.model");

const Organisation = sequelize.define(
  "Organisation",
  {
    orgid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

Organisation.belongsTo(User, {
  foreignKey: "ownerId",
});

User.belongsToMany(Organisation, {
  through: "UserOrganisation",
  foreignKey: "userId",
});

Organisation.belongsToMany(User, {
  through: "UserOrganisation",
  foreignKey: "organisationId",
});

module.exports = Organisation;
