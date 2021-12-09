const User = require('../models/user');

const getUserById = (_id) => {
	return User.findById(_id, { password: 0 });
};

const getUsersGroupBy = () => {
	return User.aggregate()
		.group({
			_id: {
				country: '$country',
				city: '$city',
			},
			userCount: { $sum: 1 },
		})
		.then((data) => {
			if (data) {
				return data.map((element) => {
					const {
						_id: { country, city },
						userCount,
					} = element;

					return { country, city, userCount };
				});
			}
		});
};

const getUsersPagination = (cuntry, city, page = 1, limit = 200) => {
	const currentPage = page || 1;
	let totalItems;
	return User.find()
		.countDocuments()
		.then((count) => {
			totalItems = count;
			return User.find({ cuntry, city }, { password: 0 })
				.skip((currentPage - 1) * limit)
				.limit(limit);
		})
		.then((users) => {
			return { count: totalItems, data: users };
		})
		.catch((err) => {
			console.error(err);
			throw err;
		});
};

module.exports = { getUserById, getUsersGroupBy, getUsersPagination };
