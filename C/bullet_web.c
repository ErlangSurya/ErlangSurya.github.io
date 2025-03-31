#include "raylib.h"
#include <stdlib.h>
#include <time.h>
#include <math.h>


struct bullet{
	Vector2 loc;
	float theta; // direction
};

double random01();

void init_bullets(struct bullet bullet_arr[], size_t size, int screenWidth, int yMargin);

int main ()
{	

	const int screenWidth = 550;
	const int screenHeight = 800;
	const int xMargin = 150;
	const int yMargin = 400;
	float arenaSize = screenWidth - 2 * xMargin;
	
	const int playerWidth = 20;
	const int playerHeight = 20;
	const float playerSpeed = 2.0;
	Rectangle player = {screenWidth/2 - playerWidth/2, 2.0*screenHeight/3, playerWidth, playerHeight};

	float lowerX = xMargin;
	float upperX = screenWidth - xMargin - playerWidth;
	float lowerY = yMargin;
	float upperY = yMargin + arenaSize - playerHeight;

	const int bulletNumber = 20;
	float bulletSpeed = 5;
	const float bulletRadius = 8;
	struct bullet bulletArr[bulletNumber];

	bool gameOver = false;



	InitWindow(screenWidth,screenHeight,"bullet");
	SetTargetFPS(60);

	// //timer
	// clock_t timeStart, timeNow;
	// timeStart = clock();
	double elapsed=0;

	// initialize bullets
	srand(time(0));


	init_bullets(bulletArr, sizeof(bulletArr)/sizeof(bulletArr[0]), screenWidth, yMargin);
	// for (int i = 0; i<bulletNumber; i++){
	// 	bulletArr[i].loc.x = random01() * screenWidth;
	// 	bulletArr[i].loc.y = random01() * yMargin;
	// 	bulletArr[i].theta = random01() * 2 * PI;
	// }


	while(!WindowShouldClose()){
		// UPDATE
		if (!gameOver){
			float dt = GetFrameTime()*60;

			if (IsKeyDown(KEY_RIGHT)) player.x += playerSpeed*dt;
			if (IsKeyDown(KEY_LEFT)) player.x -= playerSpeed*dt;
			if (IsKeyDown(KEY_UP)) player.y -= playerSpeed*dt;
			if (IsKeyDown(KEY_DOWN)) player.y += playerSpeed*dt;

			if (player.x<=lowerX) player.x = lowerX+1;
			if (player.x>=upperX) player.x = upperX-1;
			if (player.y<=lowerY) player.y = lowerY+1;
			if (player.y>=upperY) player.y = upperY-1;

			for (int i = 0; i<bulletNumber; i++){
				bulletArr[i].loc.x += bulletSpeed * cos(bulletArr[i].theta)*dt;
				bulletArr[i].loc.y -= bulletSpeed * sin(bulletArr[i].theta)*dt;

				// border collision
				if (bulletArr[i].loc.x < bulletRadius){
					bulletArr[i].loc.x = bulletRadius;
					bulletArr[i].theta = PI - bulletArr[i].theta;
				}
				if (bulletArr[i].loc.x + bulletRadius>screenWidth){
					bulletArr[i].loc.x = screenWidth - bulletRadius;
					bulletArr[i].theta = PI - bulletArr[i].theta;
				}

				if (bulletArr[i].loc.y < bulletRadius){
					bulletArr[i].loc.y = bulletRadius;
					bulletArr[i].theta = 2*PI - bulletArr[i].theta;
				}
				if (bulletArr[i].loc.y + bulletRadius>screenHeight){
					bulletArr[i].loc.y = screenHeight - bulletRadius;
					bulletArr[i].theta = 2*PI - bulletArr[i].theta;
				}

				if (CheckCollisionCircleRec(bulletArr[i].loc, bulletRadius, player)) gameOver = true;

			}
			
			// timeNow = clock();
			elapsed += dt/60;
			bulletSpeed = 5 + elapsed/10;



			// DRAW
			BeginDrawing();
				ClearBackground(BLACK);
				
				DrawText(TextFormat("Time: %.1f s", elapsed), 10, 10, 20, WHITE);
				DrawRectangleLines(0,0 , screenWidth, screenHeight, GREEN);
				DrawRectangleLines(xMargin,yMargin , arenaSize, arenaSize, GREEN);
				DrawRectangleRec(player, RED);
				for (int i = 0; i<bulletNumber; i++){
					DrawCircleV(bulletArr[i].loc, bulletRadius, WHITE);
				}
			EndDrawing();
	}
	else{
		if (IsKeyDown(KEY_R)){
			gameOver = false;
			// timeStart = clock();
			elapsed = 0;
			player.x = screenWidth/2 - playerWidth/2;
			player.y = 2.0*screenHeight/3;
			init_bullets(bulletArr, sizeof(bulletArr)/sizeof(bulletArr[0]), screenWidth, yMargin);
		} 

		BeginDrawing();
				ClearBackground(BLACK);
				int fontsize = 20;
				int s1 = MeasureText(TextFormat("Time: %.1f s", elapsed), fontsize);      
				DrawText(TextFormat("Time: %.1f s", elapsed), (screenWidth-s1)/2, screenHeight/2, fontsize, WHITE);
				int s2 = MeasureText(TextFormat("Press 'r' to restart", elapsed), fontsize);  
				DrawText("Press 'r' to restart", (screenWidth-s2)/2, screenHeight/2 + 20, fontsize, WHITE);
		EndDrawing();

	}

}
	CloseWindow();
	return 0;
}


double random01(){
	return (double)rand()/RAND_MAX;
}

void init_bullets(struct bullet bulletArr[], size_t size, int screenWidth, int yMargin){
	for (int i = 0; i<size; i++){
		bulletArr[i].loc.x = random01() * screenWidth;
		bulletArr[i].loc.y = random01() * yMargin;
		bulletArr[i].theta = random01() * 2 * PI;
	}
}