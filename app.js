/**
 * Class representing a Deposit
 */
class Deposit {
	/**
	 * Creates a Deposit
	 * @param {GameField} field The Game Field that the Deposit is on
	 * @param {Integer} distance The distance between the pickup location and this deposit
	 * @param {Integer} points The points awarded per batch of items depositied
	 * @param {Integer} seconds The seconds awarded per item deposited
	 * @param {Integer} [batchSize=1] The number of item in a batch
	 */
	constructor(field, distance, points, seconds, batchSize = 1) {
		this.field = field;
		this.distance = distance;

		this.points = points;
		this.seconds = seconds;
		this.batchSize = batchSize;

		this.counter = 0;
	}

	/**
	 * Deposits items and calculates points and seconds
	 * @param {Integer} [count=1] The number of items being deposited
	 * @returns {Array} An array containing the points and seconds awarded, in that order.
	 */
	depositItems(count = 1) {
		this.counter += count;
		var out = [0, this.field.addTime(this.seconds * count), 0];

		while (this.counter >= this.batchSize) {
			out[0] += this.points;
			this.counter -= this.batchSize;
		}

		return out;
	}
}

class CenterDeposit {
	constructor(field, oppField, distance, points, seconds) {
		this.field = field;
		this.oppField = oppField;
		this.distance = distance;
		this.points = points;
		this.seconds = seconds;
	}

	depositItems(count = 1) {
		var out = [
			this.points * count,
			0,
			this.oppField.addTime(this.seconds * count),
		];
		return out;
	}
}

class Vault {
	constructor(field, distance, points, numArtifacts) {
		this.field = field;
		this.distance = distance;
		this.points = points;
		this.numArtifacts = numArtifacts;
		this.opened = false;
	}

	open() {
		if (this.opened) return 0;
		for (var i = 0; i < this.numArtifacts; i++)
			this.field.artifacts.push(this.points);

		return this.points;
	}
}

/**
 * Class template representing a Robot. Cannot be used on it's own.
 */
class Robot {
	/**
	 * Initializes the properties of the Class
	 * @param {Number} speed The speed of the Robot in ft/s
	 * @param {Boolean} [escapeBuilding=true] Wheather the Robot escapes the building at the end of the game
	 */
	constructor(speed, escapeBuilding = true) {
		this.points = 0;
		this.seconds = 0;
		this.oppSeconds = 0;

		this.speed = speed;
		this.objectsHeld = 0;

		this.escapeBuilding = escapeBuilding;

		this.timer = 0;
	}

	/**
	 * Empty Function DO NOT use
	 */
	decideNextTask() {}

	/**
	 * Calculates the actions happening in 0.1 seconds of real time
	 * @param {Integer} timeRemaining The time remaining in the game in tenths of seconds
	 */
	step(timeRemaining) {
		if (timeRemaining < 40 / this.speed + 80) return;

		this.timer--;
		if (this.timer <= 0) {
			this.decideNextTask(timeRemaining);
		}
	}

	printable() {
		var out = {
			type: this.constructor.name,
			points: this.points,
			seconds: this.seconds,
			oppSeconds: this.oppSeconds,
			escapeBuilding: this.escapeBuilding,
		};

		return out;
	}
}

/**
 * Represents a robot that deposits water the whole game
 * @extends Robot
 */
class WaterRobot extends Robot {
	/**
	 * Creates a Robot that cycles a Water Port
	 * @param {Number} speed The speed of the Robot in ft/s
	 * @param {Deposit} port The Deposit that the robot is going to
	 * @param {Number} shootSpeed The time it takes for a robot to shoot a batch of balls
	 * @param {Number} accuracy The probability that a shot lands
	 * @param {Number} pickupSpeed The time it takes for the robot to pick up 5 balls
	 * @param {Number} manueverPenalty The time it takes to manuever the robot around obstacles on average. This values is added when calculating travel time
	 * @param {Boolean} [dump=false] Whether the Robot dumps all items at once or shoots them one at a time.
	 * @param {Boolean} escapeBuilding Whether the Robot escapes the building during endgame
	 */
	constructor(
		speed,
		port,
		shootSpeed,
		accuracy,
		pickupSpeed,
		manueverPenalty,
		dump = false,
		escapeBuilding = true
	) {
		super(speed, escapeBuilding);
		this.port = port;
		this.shootSpeed = shootSpeed * 10;
		this.accuracy = accuracy;
		this.pickupSpeed = pickupSpeed * 10;
		this.dump = dump;

		this.travelTime = port.distance / (speed / 10) + manueverPenalty * 10;
		this.travelTime = Math.round(this.travelTime);

		this.state = 2;
	}

	shoot() {
		this.dump ? (this.objectsHeld = 0) : this.objectsHeld--;
		this.timer += this.shootSpeed;
	}

	/**
	 * Decided what the Robot's next task is and updates timers and other information accordingly.
	 * @param {Integer} [timeRemaining] The time remaining in the game in tenths of seconds
	 */
	decideNextTask(timeRemaining) {
		// 0: Traveling to Water Port
		// 1: Shooting
		// 2: Traveling Home
		// 3: Pick Up Water

		switch (this.state) {
			case 0:
				this.state++;
				this.shoot();
				break;
			case 1:
				if (Math.random() < this.accuracy) {
					var shot = this.dump
						? this.port.depositItems(5)
						: this.port.depositItems(1);
					this.seconds += shot[1];
					this.oppSeconds += shot[2];
					this.points += shot[0];
				}

				if (this.objectsHeld == 0) {
					this.state++;
					this.timer += this.travelTime;
				} else this.shoot();
				break;
			case 2:
				this.state++;
				this.timer += this.pickupSpeed;
				break;
			case 3:
				this.state = 0;
				this.objectsHeld = 5;
				this.timer += this.travelTime;
				break;
		}
	}
}

class ArtifactRobot extends Robot {
	constructor(
		field,
		speed,
		port,
		pickupSpeed,
		depositSpeed,
		manueverPenalty,
		escapeBuilding = true
	) {
		super(speed, escapeBuilding);
		this.field = field;
		this.port = port;
		this.pickupSpeed = pickupSpeed;
		this.depositSpeed = depositSpeed;
		this.manueverPenalty = manueverPenalty;

		this.state = 0;
		this.position = 0;
		this.depositing = false;
	}

	travelToLocation(location) {
		var dist = Math.abs(location - this.position);
		var travelTime = dist / (this.speed / 10) + this.manueverPenalty * 10;
		this.timer += travelTime;
		this.position = location;
	}

	decideNextTask(timeRemaining) {
		// 0: travel to Artifact
		// 1: pickup Artifact
		// 2: search next artifact (if applicable)
		// 3: travel Home
		// 4: Deposit Artifacts
		switch (this.state) {
			case 0:
				this.travelToLocation(this.field.artifacts.shift());
				break;
			case 1:
				this.timer += this.pickupSpeed * 10;
				break;
			case 2:
				this.objectsHeld++;
				if (this.objectsHeld < 3) this.state = -1;
				break;
			case 3:
				this.travelToLocation(0);
				break;
			case 4:
				if (this.depositing) {
					this.objectsHeld--;
					this.points += this.port.depositItems()[0];
				} else this.depositing = true;

				if (this.objectsHeld == 0) {
					this.state = -1;
					this.depositing = false;
				} else {
					this.timer += this.depositSpeed * 10;
					this.state--;
				}

				break;
		}
		this.state++;
	}
}

class VaultArtifactRobot extends ArtifactRobot {
	constructor(
		field,
		speed,
		port,
		vault,
		vaultOpenTime,
		pickupSpeed,
		depositSpeed,
		manueverPenalty,
		escapeBuilding = true
	) {
		super(
			field,
			speed,
			port,
			pickupSpeed,
			depositSpeed,
			manueverPenalty,
			escapeBuilding
		);

		this.vault = vault;
		this.vaultOpenTime = vaultOpenTime;
		this.completedVault = false;
	}

	decideNextTask(timeRemaining) {
		if (this.completedVault) {
			ArtifactRobot.prototype.decideNextTask.call(this, timeRemaining);
			return;
		}

		// 0: Go to and open vault
		// 2: Pickup 3 items
		// 3: Go to Artifact Robot state 4

		switch (this.state) {
			case 0:
				this.travelToLocation(this.vault.distance);
				this.timer += this.vaultOpenTime * 10;
				this.state++;
				break;
			case 1:
				this.points += this.vault.open();
				this.timer += this.pickupSpeed * 3;
				this.state++;
				break;
			case 2:
				this.objectsHeld = 3;
				this.completedVault = true;
				this.state = 4;
				break;
		}
	}
}

const distances = [24.3, 25.6, 60, 15];
const [centerWaterDist, ownWaterDist, vaultDist, minDistArtifact] = distances;

/**
 * Class that represents one alliance's side of the game field
 */
class GameField {
	/**
	 * Creates a Game Field
	 */
	constructor() {
		var ownBotWaterPort = new Deposit(this, ownWaterDist, 1, 1, 3);
		var ownTopWaterPort = new Deposit(this, ownWaterDist, 1, 3);
		var artifactDeposit = new Deposit(this, undefined, 20, 0);
		var vault = new Vault(this, vaultDist, 60, 5);

		this.ports = [
			ownBotWaterPort,
			ownTopWaterPort,
			undefined,
			artifactDeposit,
			vault,
		];

		this.timer = 0;
		this.timeLimit = 900;

		this.artifacts = [];
		for (var i = 0; i < 25; i++) {
			var artifact = Math.random() * (vaultDist - minDistArtifact);
			artifact += minDistArtifact;
			artifact = Math.round(artifact);
			this.artifacts.push(artifact);
		}
		this.artifacts.sort();
	}

	finishInit(oppField, robots) {
		this.oppField = oppField;
		this.ports[2] = new CenterDeposit(this, oppField, centerWaterDist, 1, 1);

		var [
			ownBotWaterPort,
			ownTopWaterPort,
			centerWaterPort,
			artifactDeposit,
			vault,
		] = this.ports;

		var waterTopRobot = new WaterRobot(6, ownTopWaterPort, 1, 0.9, 2, 5);
		var waterBotRobot = new WaterRobot(6, ownBotWaterPort, 1, 1, 2, 5, true);
		var centerWaterRobot = new WaterRobot(6, centerWaterPort, 1, 0.8, 2, 7);
		var artifactRobot = new ArtifactRobot(this, 6, artifactDeposit, 2, 2, 5);
		var vaultArtifactRobot = new VaultArtifactRobot(
			this,
			6,
			artifactDeposit,
			vault,
			2,
			1,
			1,
			5
		);

		var robotTemplates = [
			waterTopRobot,
			waterBotRobot,
			centerWaterRobot,
			artifactRobot,
			vaultArtifactRobot,
		];

		this.robots = [];
		robots.forEach((botIndex) => {
			this.robots.push(robotTemplates[botIndex]);
		});
	}

	/**
	 * Adds seconds to the game clock while keeping the 180 second maximum rule
	 * @param {Integer} seconds The number of seconds being added to the game time
	 * @returns {Number} The amount of seconds actually added to the clock, defers from paramter when maximum game length is reached
	 */
	addTime(seconds) {
		var oldTimeLimit = this.timeLimit;
		this.timeLimit += seconds * 10;
		if (this.timeLimit > 1800) this.timeLimit = 1800;
		return (this.timeLimit - oldTimeLimit) / 10;
	}

	step() {
		var timeRemaining = this.timeLimit - this.timer;
		this.robots.forEach((robot) => {
			robot.step(timeRemaining);
		});
		this.timer++;

		if (this.timer > this.timeLimit) return 1;
		else return 0;
	}

	endgame() {
		this.robots.forEach((robot) => {
			if (robot.escapeBuilding) robot.points += 20;
		});
	}

	/**
	 * Outputs the specified values in format to the console
	 * @param color the color of the alliance ("red" | "blue")
	 */
	output(color) {
		var out = {
			allianceColor: color,
			totalGameTime: this.timeLimit / 10,
			secondsGained: 0,
			secondsGiven: 0,
			points: 0,
			robots: [],
		};
		this.robots.forEach((robot) => {
			out.secondsGained += robot.seconds;
			out.secondsGiven += robot.oppSeconds;
			out.points += robot.points;
			out.robots.push(robot.printable());
		});

		console.log(out);
		return out;
	}
}

class GameController {
	constructor(redRobots, bluRobots) {
		var redSide = new GameField();
		var bluSide = new GameField();
		redSide.finishInit(bluSide, redRobots);
		bluSide.finishInit(redSide, bluRobots);
		this.redSide = redSide;
		this.bluSide = bluSide;
	}

	simulateGame() {
		var redStop = 0;
		var bluStop = 0;
		while (!redStop && !bluStop) {
			if (!redStop) redStop = this.redSide.step();
			if (!bluStop) bluStop = this.bluSide.step();
		}

		this.redSide.endgame();
		this.bluSide.endgame();

		console.log("{\nred: ");
		var redData = this.redSide.output("Red");
		console.log(",\nblue: ");
		var bluData = this.bluSide.output("Blue");
		console.log("}");

		if (redData.points > bluData.points) console.log("Red Wins!");
		else if (bluData.points > redData.points) console.log("Blue Wins!");
		else console.log("Somehow there is a tie");
	}
}

var game = new GameController([0, 2, 4], [1, 3, 4]);
game.simulateGame();
