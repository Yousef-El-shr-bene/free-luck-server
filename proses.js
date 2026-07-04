function spotValidator(spot) {
    const name = typeof spot?.name === 'string' ? spot.name.trim() : '';
    const value = typeof spot?.value === 'string' ? spot.value.trim() : '';
    const description = typeof spot?.description === 'string' ? spot.description.trim() : '';
    const amount = Number(spot?.amount ?? 0);
    console.log(name , value , description , amount);
    
    if (!name || !value || !description || Number.isNaN(amount) || amount < 0) {
        return false;
    }

    return true;
}

module.exports = { spotValidator };