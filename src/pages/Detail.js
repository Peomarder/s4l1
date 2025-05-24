// src/pages/Detail.js
import React from 'react';

const Detail = () => {
const users = []; // Replace with your logic to fetch users
const locks = []; // Replace with your logic to fetch locks

return (
<>
<div>
<h2>Users</h2>
	<table>
	<thead>
	<tr>
	<th>Username</th>
	</tr>
	</thead>
	<tbody>
	{users.map((user) => (
	<tr key={user}>
	<td>{user}</td>
	</tr>
	))}
	</tbody>
	</table>

<h2>Locks</h2>
	<table>
	<thead>
	<tr>
	<th>Lock ID</th>
	<th>Status</th>
	</tr>
	</thead>
	<tbody>
	{locks.map((lock) => (
	<tr key={lock.id}>
	<td>{lock.id}</td>
	<td>{lock.isOpen ? 'Open' : 'Closed'}</td>
	</tr>
	))}
	</tbody>
	</table>
</div>
</>
);
};

export default Detail;